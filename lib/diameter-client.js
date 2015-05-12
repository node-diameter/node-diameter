'use strict';

var net = require('net');
var _ = require('lodash');
var diameterCodec = require('./diameter-codec');
var Q = require('q');


function DiameterSession(client, options) {
    if (!(this instanceof DiameterSession)) {
        return new DiameterSession();
    }    
    var self = this;
    self.client = client;
    self.options = options;
    self.hopByHopIdCounter = _.random(Number.MIN_VALUE, Number.MAX_VALUE);
    
    self.pendingRequests = {};
    
    var buffer = new Buffer(0, 'hex');
    client.on('data', function(data) {
    buffer = Buffer.concat([buffer, new Buffer(data, 'hex')]);
        
    // If we collected header
    if (bitsToBytes(buffer.length) >= DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES) {
        var messageLength = diameterCodec.decodeMessageHeader(buffer).header.length;
            // If we collected the entire message
            if (bitsToBytes(buffer.length) >= messageLength) {
                var message = diameterCodec.decodeMessage(buffer);
            }
        }
    });
    
    client.on('end', function() {
        if(_.isFunction(self.options.onEnd)) {
            self.options.onEnd();
        }
    });
}

DiameterSession.prototype.end = function() {
    this.client.end();  
};

DiameterSession.prototype.createRequest = function(application, commandCode) {
    return diameterCodec.constructRequest(application, commandCode, this.options.sessionId);
};

DiameterSession.prototype.sendRequest = function(request, timeout) {
    var deferred = Q.defer();
    timeout = timeout || this.options.timeout;
    request.header.hopByHopId = this.hopByHopIdCounter++;
    var requestBuffer = diameterCodec.encodeMessage(request);
    this.client.write(requestBuffer);
    return Q.timeout(deferred.promise, timeout, 'Request timed out');
};

exports.createSession = function(options) {
    var deferred = Q.defer();
    options.timeout = options.timeout || 3000;
    var client = net.createConnection(options, function() {
        var diameterSession = new DiameterSession(client);
        deferred.resolve(diameterSession);
    });
    return Q.timeout(deferred.promise, options.timeout, 'Opening connection timed out');
};
