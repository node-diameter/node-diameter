'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var sax = require('sax');
var Q = require('q');
var loki = require('lokijs');
var SparkMD5 = require('spark-md5');


var DICTIONARY_STATE_NOT_LOADED = 0;
var DICTIONARY_STATE_LOADING = 1;
var DICTIONARY_STATE_LOADED = 2;

var dictionaryState = DICTIONARY_STATE_NOT_LOADED;

var dictionary = {};

exports.getDictionary = function() {
    if (dictionaryState !== DICTIONARY_STATE_LOADED) {
        throw new Error('Dictionary requested before it was loaded');
    }
    return dictionary;
};

var dictionaryDbLocation = path.normalize(__dirname + '/../dictionary.json');
var db = new loki(dictionaryDbLocation);

var collections = [
        'applications',
        'commands',
        'avps',
        'typedefns',
        'vendors',
        'config'
    ];

var initDb = function() {
    _.each(collections, function(collection) {
        db.removeCollection(collection);
        dictionary[collection] = db.addCollection(collection);
    });
};

var parseDictionaryFiles = function(dictionaryFiles, fileStatsHash) {
    var deferred = Q.defer();
    
    var saxStream = sax.createStream(false, {lowercase: true});
    saxStream.setMaxListeners(100);

    var currentTags = {};

    var insertOrFind = function(collection, item, searchQuery) {
        var alreadyAdded = collection.findOne(searchQuery);
        if (_.isEmpty(alreadyAdded)) {
            collection.insert(item);
            return item;
        }
        return alreadyAdded;
    };

    var tagHandlers = {
        application: function(node) {
            currentTags.application = insertOrFind(dictionary.applications, node.attributes,
                { 'id': { '$eq': node.attributes.id.toString() } });
        },
        command: function(node) {
            var command = node.attributes;
            command.applicationId = currentTags.application.id;
            currentTags.command = insertOrFind(dictionary.commands, command,
                { '$and': [
                    { 'applicationId': { '$eq': command.applicationId.toString() } },
                    { 'code': { '$eq': command.code.toString() } }
                ] });
        },
        vendor: function(node) {
            currentTags.vendors = insertOrFind(dictionary.vendors, node.attributes,
                { 'id': { '$eq': node.attributes['vendor-id'].toString() } });
         },
        avp: function(node) {
            var avp = node.attributes;
            avp.applicationId = currentTags.application.id;
            currentTags.avp = insertOrFind(dictionary.avps, avp,
                { '$and': [
                    { 'applicationId': { '$eq': avp.applicationId.toString() } },
                    { 'code': { '$eq': avp.code.toString() } }
                ] });
        },
        base: function() {
            var baseApp = {
                id: '0',
                name: 'Diameter Common Messages'
            };
            currentTags.application = insertOrFind(dictionary.applications, baseApp,
                { 'id': { '$eq': baseApp.id.toString() } });
        },
        typedefn: function(node) {
            var typedefn = node.attributes;
            typedefn.applicationId = currentTags.application.id;
            currentTags.typedefn = insertOrFind(dictionary.typedefns, typedefn,
                { '$and': [
                    { 'applicationId': { '$eq': typedefn.applicationId.toString() } },
                    { 'type-name': { '$eq': typedefn['type-name'].toString() } }
                ] });
        },
        type: function(node) {
            var parent = currentTags.avp;
            parent.type = node.attributes['type-name'];
            dictionary.avps.update(parent);
        },
        'enum': function(node) {
            var parent = currentTags.avp;
            if (parent.enums == null) {
                parent.enums = [];
            }
            parent.enums.push(node.attributes);
            dictionary.avps.update(parent);
        },
        gavp: function(node) {
            var parent = currentTags.avp;
            parent.grouped = true;
            if (parent.gavps == null) {
                parent.gavps = [];
            }
            parent.gavps.push(node.attributes.name);
            dictionary.avps.update(parent);
        }
    };

    saxStream.on('error', function(error) {
        deferred.reject(error);
    });

    saxStream.on('opentag', function (node) {
        currentTags[node.name] = node.attributes;
        var tagHandler = tagHandlers[node.name];
        if (tagHandler) {
            tagHandler(node);
        }
    });
    
    saxStream.on('closetag', function (tag) {
        currentTags[tag] = null;
    });

    saxStream.on('end', function () {
        if (dictionaryFiles.length > 0) {
            fs.createReadStream(_.last(dictionaryFiles)).pipe(saxStream);
            dictionaryFiles = _.dropRight(dictionaryFiles);
        } else {
            dictionary.config.insert({
                name: 'fileStatsHash',
                value: fileStatsHash 
            });
            db.save(function() {
                deferred.resolve(dictionary); 
            });
        }
    });

    fs.createReadStream(_.last(dictionaryFiles)).pipe(saxStream);
    dictionaryFiles = _.dropRight(dictionaryFiles);
    
    return deferred.promise;
};

var getFileStats = function(files) {
    return _.map(files, function(file) {
        return [file, fs.statSync(file).mtime];
    });
};

var hashFileStats = function(fileStats) {
    var hash = new SparkMD5();
    _.each(fileStats, function(stat) {
        hash.append(stat[0]);
        hash.append(stat[1]);
    });
    return hash.end();
};

var isDbUpToDate = function(fileStatsHash) {
    var hashObject = dictionary.config.findOne({ 'name': { '$eq': 'fileStatsHash' }});
    if (hashObject == null) {
        return false;
    } else {
        return hashObject.value === fileStatsHash;
    }
};

var dictionaryDeferred = Q.defer();
exports.getDictionary = function() {
    if (dictionaryState !== DICTIONARY_STATE_NOT_LOADED) {
        return dictionaryDeferred.promise;
    }
    dictionaryState = DICTIONARY_STATE_LOADING;
    var dictionariesLocation = path.normalize(__dirname + '/../dictionaries');

    initDb();

    fs.readdir(dictionariesLocation, function(error, files) {
        if (!_.isEmpty(error)) {
            dictionaryDeferred.reject('Error reading dictionary files: ' + error);
            return;
        }
        files = _(files)
            .filter(function(file) {
                return _.endsWith(file.toLowerCase(), '.xml');
            })
            .map(function(file) {
                return path.normalize(dictionariesLocation + '/' + file);
            }).value();
        if (files.length > 0) {
            var fileStats = getFileStats(files);
            var fileStatsHash = hashFileStats(fileStats);

            if (!fs.existsSync(dictionaryDbLocation)) {
                parseDictionaryFiles(files, fileStatsHash).then(dictionaryDeferred.resolve, 
                        dictionaryDeferred.reject);
            } else {
                db.loadDatabase({}, function() {
                    _.each(collections, function(collection) {
                        dictionary[collection] = db.getCollection(collection);
                    });
                    if (isDbUpToDate(fileStatsHash)) {
                        dictionaryDeferred.resolve(dictionary);
                    } else {
                        parseDictionaryFiles(files, fileStatsHash).then(dictionaryDeferred.resolve, 
                            dictionaryDeferred.reject);
                    }
                });
            }
        } else {
            dictionaryDeferred.reject('Dictionary files not found');
        }
    });
    return dictionaryDeferred.promise;
};
