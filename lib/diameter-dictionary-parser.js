'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var sax = require('sax');
var Q = require('q');

var dictionaryLoad = false;

var dictionaryDeferred = Q.defer();
exports.getDictionary = function() {
    if (dictionaryLoad) {
        return dictionaryDeferred.promise;
    }
    dictionaryLoad = true;
    var dictionariesLocation = path.normalize(__dirname + '/../dictionaries');

    var dictionary = {
        base: [],
        applications: []
    };

    var dictionaryFiles = null;
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
    }

    saxStream.on('error', function(error) {
        dictionaryDeferred.reject(error);
    });

    saxStream.on("opentag", function (node) {
        currentTags[node.name] = node.attributes;
        var tagHandler = tagHandlers[node.name];
        if (tagHandler) {
            tagHandler(node);
        }
    });
    
    saxStream.on("closetag", function (tag) {
        currentTags[tag] = null;
    });

    saxStream.on("end", function () {
        if (dictionaryFiles.length > 0) {
            fs.createReadStream(_.last(dictionaryFiles)).pipe(saxStream);
            dictionaryFiles = _.dropRight(dictionaryFiles);
        } else {
            // console.log(util.inspect(dictionary, {showHidden: false, depth: null}));
            dictionaryDeferred.resolve(dictionary);
        }
    });

    fs.readdir(dictionariesLocation, function(error, files) {
        dictionaryFiles = _(files)
            .filter(function(file) {
                return _.endsWith(file.toLowerCase(), '.xml');
            })
            .map(function(file) {
                return path.normalize(dictionariesLocation + '/' + file);
            }).value();

        if (dictionaryFiles.length > 0) {
            fs.createReadStream(_.last(dictionaryFiles)).pipe(saxStream);
            dictionaryFiles = _.dropRight(dictionaryFiles);
        }
    });
    return dictionaryDeferred.promise;
}
