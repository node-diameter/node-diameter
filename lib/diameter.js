'use strict';

var DiameterServer = require('./diameter-server').DiameterServer;
var DiameterSession = require('./diameter-session').DiameterSession;
var diameterUtil = require('./diameter-util');
var diameterClient = require('./diameter-client');

exports.createServer = function(session) {
    return new DiameterServer(session);
};

exports.createSession = function(options) {
    return new DiameterSession(options);
};

exports.connect = diameterClient.connect;

exports.messageToColoredString = diameterUtil.messageToColoredString;
