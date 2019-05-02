'use strict';

const DiameterConnection = require('./diameter-connection').DiameterConnection;
const diameterUtil = require('./diameter-util');
const net = require('net');
const sctp = require('sctp');


exports.createServer = function(options, connectionListener) {
    const socketLib = options.protocol === 'sctp'? sctp : net;
    var server = socketLib.createServer(options, function(socket) {
        var connection = new DiameterConnection(options, socket);
        socket.diameterConnection = connection;
        connectionListener(socket);
    });
    return server;
};

exports.createConnection = function(options, connectionListener) {
    options.host = options.host || 'localhost';
    const socketLib = options.protocol === 'sctp'? sctp : net;
    var socket = socketLib.createConnection(options, connectionListener);
    var connection = new DiameterConnection(options, socket);
    socket.diameterConnection = connection;
    return socket;
};

exports.messageToColoredString = diameterUtil.messageToColoredString;

exports.logMessage = function(message) {
    console.log(exports.messageToColoredString(message));
};

exports.getAvpValue = diameterUtil.getAvpValue;