'use strict';

var net = require('net');
var _ = require('lodash');
var diameterCodec = require('./diameter-codec');
var diameterUtil = require('./diameter-util');
var Q = require('q');


var DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES = 20;

function DiameterSession(client, options) {
    if (!(this instanceof DiameterSession)) {
        return new DiameterSession();
    }    
    var self = this;
    self.client = client;
    self.options = options;
    self.hopByHopIdCounter = diameterUtil.random32BitNumber();
    
    self.pendingRequests = {};
    
    var buffer = new Buffer(0, 'hex');
    client.on('data', function(data) {
        buffer = Buffer.concat([buffer, new Buffer(data, 'hex')]);
        
        // If we collected header
        if (diameterUtil.bitsToBytes(buffer.length) >= DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES) {
            var messageLength = diameterCodec.decodeMessageHeader(buffer).header.length;
            // If we collected the entire message
            if (diameterUtil.bitsToBytes(buffer.length) >= messageLength) {
                var response = diameterCodec.decodeMessage(buffer);
                var promise = self.pendingRequests[response.hopByHopId];
                if (promise != null) {
                    self.pendingRequests[response.hopByHopId] = undefined;
                    promise.resolve(response);
                } else {
                    // what do?
                }
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

DiameterSession.prototype.createRequest = function(application, command) {
    return diameterCodec.constructRequest(application, command, this.options.sessionId);
};

DiameterSession.prototype.sendRequest = function(request, timeout) {
    var deferred = Q.defer();
    timeout = timeout || this.options.timeout;
    request.header.hopByHopId = this.hopByHopIdCounter++;
    var requestBuffer = diameterCodec.encodeMessage(request);
    this.client.write(requestBuffer);
    var promise = Q.timeout(deferred.promise, timeout, 'Request timed out');
    this.pendingRequests[request.hopByHopId] = promise;
    return promise;
};

exports.createSession = function(options) {
    var deferred = Q.defer();
    options.timeout = options.timeout || 3000;
    diameterCodec.initDictionary().then(function () {
        var client = net.createConnection(options, function() {
            var diameterSession = new DiameterSession(client, options);
            deferred.resolve(diameterSession);
        });
    }, function() {
        deferred.reject('Dictionary init failed');
    });
    return Q.timeout(deferred.promise, options.timeout, 'Opening connection timed out');
};
