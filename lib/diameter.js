'use strict';

var DiameterServer = require('./diameter-server').DiameterServer;
var DiameterSession = require('./diameter-session').DiameterSession;
var diameterUtil = require('./diameter-util');
var diameterClient = require('./diameter-client');
var diameterCodec = require('./diameter-codec');
var Q = require('q');

exports.createServer = function(session) {
    return new DiameterServer(session);
};

exports.createSession = function(options) {
    var deferred = Q.defer();
    diameterCodec.initDictionary().then(function() {
        deferred.resolve(new DiameterSession(options));
    }, deferred.reject);
    return deferred.promise;
};

exports.connect = diameterClient.connect;

exports.messageToColoredString = diameterUtil.messageToColoredString;
