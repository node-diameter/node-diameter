'use strict';

var DiameterSession = require('./diameter-session').DiameterSession;
var diameterUtil = require('./diameter-util');
var diameterDictionary = require('./diameter-dictionary');
var Q = require('q');
var net = require('net');


exports.createServer = function(options, connectionListener) {
    var server = net.createServer(options, function(socket) {
        var session = new DiameterSession(options, socket);
        socket.diameterSession = session;
        connectionListener(socket);
    });
    return server;
};

exports.getLokiDictionary = function() {
    var deferred = Q.defer();
    diameterDictionary.initDictionary().then(function() {
        deferred.resolve(diameterDictionary);
    }, deferred.reject);
    return deferred.promise;
};

exports.createConnection = function(options, connectionListener) {
    var socket = net.createConnection(options.port, options.host || 'localhost', connectionListener);
    var session = new DiameterSession(options, socket);
    socket.diameterSession = session;
    return socket;
};

exports.messageToColoredString = diameterUtil.messageToColoredString;

exports.logMessage = function(message) {
    console.log(exports.messageToColoredString(message));
};