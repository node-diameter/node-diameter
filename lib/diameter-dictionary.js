'use strict';

var _ = require('lodash');
var fs = require('fs');
var path = require('path');


var dictionaryLocation = path.normalize(__dirname + '/../dictionary.json');
var dictionary = JSON.parse(fs.readFileSync(dictionaryLocation, 'utf8'));

exports.getApplicationById = function(appId) {
    return _.find(dictionary.applications, {code: appId});
};

exports.getApplicationByName = function(appName) {
    return _.find(dictionary.applications, {name: appName});
};

exports.getCommandByCode = function(code) {
    return _.find(dictionary.commands, {code: code});
};

exports.getCommandByName = function(name) {
    return _.find(dictionary.commands, {name: name});
};

exports.getAvpByCode = function(code) {
    return _.find(dictionary.avps, {code: code});
};

exports.getAvpByCodeAndVendorId = function(code, vendorId) {
    return _.find(dictionary.avps, {code: code, vendorId: vendorId});
};

exports.getAvpByName = function(name) {
    return _.find(dictionary.avps, {name: name});
};
