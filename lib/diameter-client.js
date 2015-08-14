'use strict';

var net = require('net');
var _ = require('lodash');
var Q = require('q');


exports.connect = function(options, session) {
    if (session === undefined) {
        throw "Session required";
    }
    var deferred = Q.defer();
    options.timeout = options.timeout || 3000;
    var socket = net.createConnection(options, function() {
        session.bindToSocket(socket);
        deferred.resolve(session);
    });
    return Q.timeout(deferred.promise, options.timeout, 'Opening connection timed out');
};
