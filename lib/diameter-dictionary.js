'use strict';

var _ = require('lodash');
var Q = require('q');
var util = require('util');
var diameterDictionaryParser = require('./diameter-dictionary-parser');


exports.getCommandByCode = function(appId, commandCode) {
    var deferred = Q.defer();

    diameterDictionaryParser.getDictionary().then(function(dictionary) {
        var application = _.find(dictionary.applications, {id: appId.toString()});
        if (application) {
            var command = _.find(application.commands, {code: commandCode.toString()});
            if (command) {
                deferred.resolve(command);
                return;
            }
        }
        // If not found for application, try base
        var command = _.find(dictionary.base.commands, {code: commandCode.toString()});
        if (command) {
            deferred.resolve(command);
            return;
        }
        if (appId === '0') {
            deferred.reject('Command ' + commandCode + ' not found');
            return;
        }
        // If not found, try 'Common' application, with id 0
        exports.getCommandByCode('0', commandCode).then(deferred.resolve, deferred.reject);
    }, deferred.reject);

    return deferred.promise;
}

var getAvpByAttribute = function(appId, avpCode, attribute) {
    var deferred = Q.defer();
    diameterDictionaryParser.getDictionary().then(function(dictionary) {
        var application = _.find(dictionary.applications, {id: appId.toString()});
        if (application) {
            var avp = _.find(application.avps, function(a) {
                return a[attribute] === avpCode.toString();
            });
            if (avp) {
                deferred.resolve(avp);
                return;
            }
        }
        // If not found for application, try base
        var avp = _.find(dictionary.base.avps, function(a) {
                return a[attribute] === avpCode.toString();
            });
        if (avp) {
            deferred.resolve(avp);
            return;
        }
        if (appId === '0') {
            deferred.reject('Avp ' + avpCode + ' not found');
            return;
        }
        // If not found, try 'Common' application, with id 0
        exports.getAvpByCode('0', avpCode).then(deferred.resolve, deferred.reject);
    }, deferred.reject);

    return deferred.promise;
}

exports.getAvpByCode = function(appId, avpCode) {
    return getAvpByAttribute(appId, avpCode, 'code');
};

exports.getAvpByName = function(appId, avpCode) {
    return getAvpByAttribute(appId, avpCode, 'name');
};

exports.getTypedefn = function(type, appId) {
    var deferred = Q.defer();
    if (type === null) {
        deferred.reject('Typedefn not found');
    }
    diameterDictionaryParser.getDictionary().then(function(dictionary) {
        var application = _.find(dictionary.applications, {id: appId});
        if (application) {
            var typedefn = _.find(application.typedefns, {'type-name': type});
            if (typedefn) {
                deferred.resolve(typedefn);
                return;
            }
        }
        // If not found for application, try base
        var typedefn = _.find(dictionary.base.typedefns, {'type-name': type});
        if (typedefn) {
            deferred.resolve(typedefn);
            return;
        }
        if (appId === '0') {
            deferred.reject('Typedefn not found');
            return;
        }
        // If not found, try 'Common' application, with id 0
        exports.getTypedefn(type, appId).then(deferred.resolve, deferred.reject);
    }, deferred.reject);
    return deferred.promise;
}

exports.resolveToBaseType = function(type, appId) {
    var deferred = Q.defer();
    exports.getTypedefn(type, appId).then(function(typedefn) {
        if (typedefn['type-parent']) {
            exports.resolveToBaseType(typedefn['type-parent'], appId).then(deferred.resolve, deferred.reject);
        } else {
            deferred.resolve(typedefn['type-name']);
        }
    }, deferred.reject);
    return deferred.promise;
}
