'use strict';

var _ = require('lodash');
var Q = require('q');
var diameterDictionaryParser = require('./diameter-dictionary-parser');
var diameterTypes = require('./diameter-types');


var dictionary = null;

exports.initDictionary = function() {
    var deferred = Q.defer();
    diameterDictionaryParser.getDictionary().then(function(dict) {
        dictionary = dict;
        deferred.resolve(dictionary);
    }, deferred.reject);
    return deferred.promise;
};

exports.getApplicationById = function(appId) {
    return dictionary.applications.findOne({
        'id': {
            '$eq': appId.toString()
        }
    });
};

exports.getApplicationByName = function(appName) {
    return dictionary.applications.findOne({
        'name': {
            '$eq': appName.toString()
        }
    });
};

exports.getVendorByVendorId = function(vendorId) {
    return dictionary.vendors.findOne({
        'vendor-id': {
            '$eq': vendorId.toString()
        }
    });
};

exports.getVendorByCode = function(vendorCode) {
    return dictionary.vendors.findOne({
        'code': {
            '$eq': vendorCode.toString()
        }
    });
};

exports.getVendorByName = function(vendorName) {
    return dictionary.vendors.findOne({
        'name': {
            '$eq': vendorName.toString()
        }
    });
};

var getCommandByAttribute = function(appId, value, attribute) {
    var attributeQuery = {};
    attributeQuery[attribute] = {
        '$eq': value.toString()
    };
    var command = dictionary.commands.findOne({
        '$and': [{
                'applicationId': {
                    '$eq': appId.toString()
                }
            },
            attributeQuery
        ]
    });
    if (command == null && appId !== '0') {
        return exports.getCommandByAttribute('0', value, attribute);
    }
    return command;
};

exports.getCommandByCode = function(appId, value) {
    return getCommandByAttribute(appId, value, 'code');
};

exports.getCommandByName = function(appId, value) {
    return getCommandByAttribute(appId, value, 'name');
};

var getAvpByAttribute = function(appId, value, attribute) {
    var attributeQuery = {};
    attributeQuery[attribute] = {
        '$eq': value.toString()
    };
    var avp = dictionary.avps.findOne({
        '$and': [{
                'applicationId': {
                    '$eq': appId.toString()
                }
            },
            attributeQuery
        ]
    });
    if (avp == null && appId !== '0') {
        return getAvpByAttribute('0', value, attribute);
    }
    return avp;
};

exports.getAvpByCode = function(appId, avpCode) {
    return getAvpByAttribute(appId, avpCode.toString(), 'code');
};

exports.getAvpByName = function(appId, avpCode) {
    return getAvpByAttribute(appId, avpCode, 'name');
};

exports.getTypedefn = function(type, appId) {
    var typedefn = dictionary.typedefns.findOne({
        '$and': [{
            'applicationId': {
                '$eq': appId.toString()
            }
        }, {
            'type-name': {
                '$eq': type.toString()
            }
        }]
    });
    if (typedefn == null && appId !== '0') {
        return exports.getTypedefn(type, '0');
    }
    return typedefn;
};

exports.resolveToBaseType = function(type, appId) {
    var parsableTypes = diameterTypes.getParsableTypes();
    var typedefn = exports.getTypedefn(type, appId);
    if (_.contains(parsableTypes, typedefn['type-name'])) {
        return typedefn['type-name'];
    } else if (typedefn['type-parent'] !== undefined) {
        return exports.resolveToBaseType(typedefn['type-parent'], appId);
    }
    throw new Error('Unable to resolve type ' + type + ' for app ' + appId);
};