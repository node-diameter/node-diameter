'use strict';

var DiameterServer = require('./diameter-server').DiameterServer;
var diameterUtil = require('./diameter-util');


exports.createServer = function(options) {
    return new DiameterServer(options);
};

exports.messageToColoredString = diameterUtil.messageToColoredString;
