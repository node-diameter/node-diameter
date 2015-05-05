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

var db = new loki('dictionary.json');

var parseDictionaryFiles = function(dictionaryFiles) {
    var deferred = Q.defer();

    var saxStream = sax.createStream(false, {lowercase: true});
    saxStream.setMaxListeners(100);

    var currentTags = {};

    // Push to target array if element with that 'id' is not already in it,
    // return element with that 'id', if it is
    var pushOrFind = function(targetArray, item) {
        var alreadyAdded = _.find(targetArray, {id: item.id});
        if (!alreadyAdded) {
            targetArray.push(item);
            return item;
        }
        return alreadyAdded;
    };

    // Return 'base' tag or 'application' tag, as top parent elements
    var getTopParent = function() {
        if (currentTags.base) {
            return currentTags.base;
        }
        return currentTags.application;
    };

    var tagHandlers = {
        application: function(node) {
            currentTags.application = pushOrFind(dictionary.applications, node.attributes);
        },
        command: function(node) {
            var parent = getTopParent();
            if (parent.commands == null) parent.commands = [];
            pushOrFind(parent.commands, node.attributes);
        },
        avp: function(node) {
            var parent = getTopParent();
            if (parent.avps == null) parent.avps = [];
            pushOrFind(parent.avps, node.attributes);
        },
        base: function(node) {
            dictionary.base = node.attributes;
        },
        typedefn: function(node) {
            var parent = getTopParent();
            if (parent.typedefns == null) parent.typedefns = [];
            pushOrFind(parent.typedefns, node.attributes);  
        },
        type: function(node) {
            var parent = currentTags.avp;
            parent.type = node.attributes['type-name'];
        },
        enum: function(node) {
            var parent = currentTags.avp;
            if (parent.enums == null) parent.enums = [];
            pushOrFind(parent.enums, node.attributes);
        },
        gavp: function(node) {
            var parent = currentTags.avp;
            parent.grouped = true;
            if (parent.gavps == null) parent.gavps = [];
            pushOrFind(parent.gavps, node.attributes);
        }
    };

    saxStream.on('error', function(error) {
        dictionaryDeferred.reject(error);
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
            // console.log(util.inspect(dictionary, {showHidden: false, depth: null}));
            deferred.resolve(dictionary);
        }
    });

    fs.createReadStream(_.last(dictionaryFiles)).pipe(saxStream);
    dictionaryFiles = _.dropRight(dictionaryFiles);
};

var dictionaryDeferred = Q.defer();
exports.getDictionary = function() {
    if (dictionaryState !== DICTIONARY_STATE_NOT_LOADED) {
        return dictionaryDeferred.promise;
    }
    dictionaryState = DICTIONARY_STATE_LOADING;
    var dictionariesLocation = path.normalize(__dirname + '/../dictionaries');

    fs.readdir(dictionariesLocation, function(error, files) {
        if (error !== undefined) {
            console.log(error);
        }
        dictionaryFiles = _(files)
            .filter(function(file) {
                return _.endsWith(file.toLowerCase(), '.xml');
            })
            .map(function(file) {
                return path.normalize(dictionariesLocation + '/' + file);
            }).value();

        if (dictionaryFiles.length > 0) {
            parseDictionaryFiles().then(console.log, console.log);
        }
    });
    return dictionaryDeferred.promise;
};
