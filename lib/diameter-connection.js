'use strict';

var _ = require('lodash');
var diameterCodec = require('./diameter-codec');
var diameterUtil = require('./diameter-util');
var Q = require('bluebird');


var DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES = 20;

var getSessionId = function(message) {
    var sessionIdAvp = _.find(message.body, function(avp) {
        return avp[0] === 'Session-Id';
    });
    if (sessionIdAvp !== undefined) return sessionIdAvp[1];
    return undefined;
};

function DiameterConnection(options, socket) {
    if (!(this instanceof DiameterConnection)) {
        return new DiameterConnection(options, socket);
    }
    options = options || {};
    var self = this;
    self.socket = socket;
    self.options = options;
    self.pendingRequests = {};
    self.hopByHopIdCounter = diameterUtil.random32BitNumber();

    var buffer = new Buffer(0);

    self.socket.on('data', function(data) {
        try {
            buffer = Buffer.concat([buffer, data instanceof Buffer ? data : new Buffer(data)]);

            // If we collected header
            if (buffer.length >= DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES) {
                var messageLength = diameterCodec.decodeMessageHeader(buffer).header.length;

                // If we collected the entire message
                if (buffer.length >= messageLength) {
                    var message = diameterCodec.decodeMessage(buffer);

                    if (message.header.flags.request) {
                        var response = diameterCodec.constructResponse(message);

                        if (_.isFunction(self.options.beforeAnyMessage)) {
                            self.options.beforeAnyMessage(message);
                        }

                        self.socket.emit('diameterMessage', {
                            sessionId: getSessionId(message),
                            message: message,
                            response: response,
                            callback: function(response) {
                                if (_.isFunction(self.options.afterAnyMessage)) {
                                    self.options.afterAnyMessage(response);
                                }
                                var responseBuffer = diameterCodec.encodeMessage(response);
                                self.socket.write(responseBuffer);
                            }
                        });
                    } else {
                        var pendingRequest = self.pendingRequests[message.header.hopByHopId];
                        if (pendingRequest != null) {
                            if (_.isFunction(self.options.afterAnyMessage)) {
                                self.options.afterAnyMessage(message);
                            }
                            delete self.pendingRequests[message.header.hopByHopId];
                            pendingRequest.deferred.resolve(message);
                        } else {
                            // handle this
                        }
                    }
                    buffer = buffer.slice(messageLength);
                }
            }
        } catch (err) {
            self.socket.emit('error', err);
        }
    });

    self.createRequest = function(application, command, sessionId) {
        if (sessionId === undefined) {
            sessionId = diameterUtil.random32BitNumber();
        }
        return diameterCodec.constructRequest(application, command, sessionId);
    };

    self.sendRequest = function(request, timeout) {
        var deferred = Q.defer();
        if (this.socket === undefined) {
            deferred.reject('Socket not bound to session.');
            return deferred.promise;
        }
        timeout = timeout || this.options.timeout || 3000;
        request.header.hopByHopId = this.hopByHopIdCounter++;
        if (_.isFunction(this.options.beforeAnyMessage)) {
            this.options.beforeAnyMessage(request);
        }
        var requestBuffer = diameterCodec.encodeMessage(request);
        this.socket.write(requestBuffer);
        var promise = deferred.promise.timeout(timeout, 'Request timed out, no response was received in ' + timeout + 'ms');
        this.pendingRequests[request.header.hopByHopId] = {
            'request': request,
            'deferred': deferred
        };
        return promise;
    };

    self.end = function() {
        socket.end();
    };
}

exports.DiameterConnection = DiameterConnection;
