'use strict';

var net = require('net');
var _ = require('lodash');
var diameterCodec = require('./diameter-codec');
var Q = require('q');


var DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES = 20;


function DiameterServer(session) {
    if (!(this instanceof DiameterServer)) {
        return new DiameterServer(session);
    }    

    var self = this;
    self.session = session;

    this.tcpserver = net.createServer(function(socket) {
        self.session.bindToSocket(socket);
    });
}

DiameterServer.prototype.listen = function(options) {
    if (options.host == null) {
        throw new Error('Host not specified');
    }
    if (options.port == null) {
        throw new Error('Port not specified');
    }
    var deferred = Q.defer();
    var self = this;
    diameterCodec.initDictionary().then(function() {
        self.tcpserver.listen(options.port, options.host);
        deferred.resolve();
    }, deferred.reject);
    return deferred.promise;
};


exports.DiameterServer = DiameterServer;
