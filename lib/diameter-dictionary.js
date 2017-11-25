'use strict';

var _ = require('lodash');
var dictionary = require(process.env.DIAMETER_DICTIONARY || 'diameter-dictionary');


var cache = {
    avpsByName: {},
    avpsByCode: [],
    commandsByName: {},
    commandsByCode: [],
    applicationsByName: {},
    applicationsById: [],
    avpsByCodeAndVendorId: []
}

exports.getApplicationById = function(appId) {
    var cached = cache.applicationsById[appId];
    if (cached !== undefined) return cached;
    var app = _.find(dictionary.applications, {code: appId});
    cache.applicationsById[appId] = app;
    return app;
};

exports.getApplicationByName = function(name) {
    var cached = cache.applicationsByName[name];
    if (cached !== undefined) return cached;
    var app = _.find(dictionary.applications, {name: name});
    cache.applicationsByName[name] = app;
    return app;
};

exports.getCommandByCode = function(code) {
    var cached = cache.commandsByCode[code];
    if (cached !== undefined) return cached;
    var command = _.find(dictionary.commands, {code: code});
    cache.commandsByCode[code] = command;
    return command;
};

exports.getCommandByName = function(name) {
    var cached = cache.commandsByName[name];
    if (cached !== undefined) return cached;
    var command = _.find(dictionary.commands, {name: name});
    cache.commandsByName[name] = command;
    return command;
};

exports.getAvpByCode = function(code) {
    var cached = cache.avpsByCode[code];
    if (cached !== undefined) return cached;
    var avp = _.find(dictionary.avps, {code: code});
    cache.avpsByCode[code] = avp;
    return avp;
};

exports.getAvpByCodeAndVendorId = function(code, vendorId) {
    if (cache.avpsByCodeAndVendorId[vendorId] === undefined) cache.avpsByCodeAndVendorId[vendorId] = [];
    var vendorAvps = cache.avpsByCodeAndVendorId[vendorId];
    var avp = vendorAvps[code];
    if (avp !== undefined) return avp;
    avp = _.find(dictionary.avps, {code: code, vendorId: vendorId});
    vendorAvps[code] = avp;
    return avp;
};

exports.getAvpByName = function(name) {
    var cached = cache.avpsByName[name];
    if (cached !== undefined) return cached;
    var avp = _.find(dictionary.avps, {name: name});
    cache.avpsByName[name] = avp;
    return avp;
};
