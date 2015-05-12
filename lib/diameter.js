'use strict';

var DiameterServer = require('./diameter-server').DiameterServer;
var diameterUtil = require('./diameter-util');
var diameterClient = require('./diameter-client');

exports.createServer = function(options) {
    return new DiameterServer(options);
};

exports.createSession = diameterClient.createSession;

exports.messageToColoredString = diameterUtil.messageToColoredString;
