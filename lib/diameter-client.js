'use strict';

var net = require('net');
var _ = require('lodash');
var diameterCodec = require('./diameter-codec');
var DiameterSession = require('./diameter-session').DiameterSession;
var Q = require('q');


exports.connect = function(options, session) {
    var deferred = Q.defer();
    options.timeout = options.timeout || 3000;
    diameterCodec.initDictionary().then(function () {
        var socket = net.createConnection(options, function() {
            if (session === undefined) {
                session = new DiameterSession(options);
            }
            session.bindToSocket(socket);
            deferred.resolve(session);
        });
    }, function() {
        deferred.reject('Dictionary init failed');
    });
    return Q.timeout(deferred.promise, options.timeout, 'Opening connection timed out');
};
