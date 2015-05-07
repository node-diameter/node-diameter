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

exports.getCommandByCode = function(appId, commandCode) {
    return dictionary.commands.findOne({
            '$and': [
                { 'applicationId': { '$in': ['0', appId.toString()] } },
                { 'code': { '$eq': commandCode.toString() } }
            ]
        });
};

var getAvpByAttribute = function(appId, value, attribute) {
    var attributeQuery = {};
    attributeQuery[attribute] = { '$eq': value.toString() };
    return dictionary.avps.findOne({
            '$and': [
                { 'applicationId': { '$in': ['0', appId.toString()] } },
                attributeQuery
            ]
        });
};

exports.getAvpByCode = function(appId, avpCode) {
    return getAvpByAttribute(appId, avpCode, 'code');
};

exports.getAvpByName = function(appId, avpCode) {
    return getAvpByAttribute(appId, avpCode, 'name');
};

exports.getTypedefn = function(type, appId) {
    return dictionary.typedefns.findOne({
            '$and': [
                { 'applicationId': { '$in': ['0', appId.toString()] } },
                { 'type-name': { '$eq': type.toString() } }
            ]
        });
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
