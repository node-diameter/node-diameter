'use strict';

var _ = require('lodash');
var Q = require('q');
var diameterTypes = require('./diameter-types');
var path = require('path');
var loki = require('lokijs');

var dictionary = null;

exports.initDictionary = function() {
    var deferred = Q.defer();
    var dictionaryDbLocation = path.normalize(__dirname + '/../dictionary.json');
    var db = new loki(dictionaryDbLocation);
    db.loadDatabase({}, function() {
        dictionary = _(db.listCollections()).pluck('name').reduce(function(d, collectionName) {
            d[collectionName] = db.getCollection(collectionName);
            return d;
        }, {});
        deferred.resolve(dictionary);
    });
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

var getTypedefn = function(type, appId) {
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
        return getTypedefn(type, '0');
    }
    return typedefn;
};

exports.resolveToBaseType = function(type, appId) {
    var parsableTypes = diameterTypes.getParsableTypes();
    var typedefn = getTypedefn(type, appId);
    if (_.contains(parsableTypes, typedefn['type-name'])) {
        return typedefn['type-name'];
    } else if (typedefn['type-parent'] !== undefined) {
        return exports.resolveToBaseType(typedefn['type-parent'], appId);
    }
    throw new Error('Unable to resolve type ' + type + ' for app ' + appId);
};