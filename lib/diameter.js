'use strict';

var DiameterConnection = require('./diameter-connection').DiameterConnection;
var diameterUtil = require('./diameter-util');
var Q = require('bluebird');
var net = require('net');


exports.createServer = function(options, connectionListener) {
    var server = net.createServer(options, function(socket) {
        var connection = new DiameterConnection(options, socket);
        socket.diameterConnection = connection;
        connectionListener(socket);
    });
    return server;
};

exports.createConnection = function(options, connectionListener) {
    options.host = options.host || 'localhost';
    var socket = net.createConnection(options, connectionListener);
    var connection = new DiameterConnection(options, socket);
    socket.diameterConnection = connection;
    return socket;
};

exports.messageToColoredString = diameterUtil.messageToColoredString;

exports.logMessage = function(message) {
    console.log(exports.messageToColoredString(message));
};

exports.getAvpValue = diameterUtil.getAvpValue;