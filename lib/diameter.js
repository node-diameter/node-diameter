'use strict';

var DiameterSession = require('./diameter-session').DiameterSession;
var diameterUtil = require('./diameter-util');
var Q = require('bluebird');
var net = require('net');


exports.createServer = function(options, connectionListener) {
    var server = net.createServer(options, function(socket) {
        var session = new DiameterSession(options, socket);
        socket.diameterSession = session;
        connectionListener(socket);
    });
    return server;
};

exports.createConnection = function(options, connectionListener) {
    options.host = options.host || 'localhost';
    var socket = net.createConnection(options, connectionListener);
    var session = new DiameterSession(options, socket);
    socket.diameterSession = session;
    return socket;
};

exports.messageToColoredString = diameterUtil.messageToColoredString;

exports.logMessage = function(message) {
    console.log(exports.messageToColoredString(message));
};
