'use strict';

var _ = require('lodash');
var diameterCodec = require('./diameter-codec');
var diameterUtil = require('./diameter-util');
var Q = require('q');


var DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES = 20;

function DiameterApplication() {
    if (!(this instanceof DiameterApplication)) {
        return new DiameterApplication();
    }    
    var self = this;
    self.commandHandlers = {};
}

DiameterApplication.prototype.onCommand = function(commandName, handlerFunction) {
    this.commandHandlers[commandName] = handlerFunction;
};

DiameterApplication.prototype.handleRequest = function(request, response, callback) {
    var handlerFunction = this.commandHandlers[request.command];
    handlerFunction(request, response, callback);
};

function DiameterSession(options) {
    if (!(this instanceof DiameterSession)) {
        return new DiameterSession();
    }    
    var self = this;
    self.socket = undefined;
    self.options = options;
    self.applications = {};
    self.pendingRequests = {};
    self.hopByHopIdCounter = diameterUtil.random32BitNumber();

    var buffer = new Buffer(0, 'hex');

    self.socketDataHandler = function(data) {
        buffer = Buffer.concat([buffer, new Buffer(data, 'hex')]);
        
        // If we collected header
        if (diameterUtil.bitsToBytes(buffer.length) >= DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES) {
            var messageLength = diameterCodec.decodeMessageHeader(buffer).header.length;
            // If we collected the entire message
            if (diameterUtil.bitsToBytes(buffer.length) >= messageLength) {
                var message = diameterCodec.decodeMessage(buffer);

                if (message.header.flags.request) {
                    var response = diameterCodec.constructResponse(message);
                    var application = self.applications[message.header.applicationId];
                    if (application === undefined) {
                        // TODO handle this
                        throw "Application not found";
                    }
                    if (_.isFunction(self.options.beforeAnyCommand)) {
                        self.options.beforeAnyCommand(message, response);
                    }
                    application.handleRequest(message, response, function(request, response) {
                        if (_.isFunction(self.options.afterAnyCommand)) {
                            self.options.afterAnyCommand(message, response);
                        }
                        var responseBuffer = diameterCodec.encodeMessage(response);
                        self.socket.write(responseBuffer);
                    });
                    buffer = buffer.slice(messageLength);                    
                } else {
                    var pendingRequest = self.pendingRequests[message.hopByHopId];
                    if (pendingRequest != null) {
                        if (_.isFunction(self.options.afterAnyCommand)) {
                            self.options.afterAnyCommand(pendingRequest.request, message);
                        }
                        self.pendingRequests[message.hopByHopId] = undefined;
                        pendingRequest.deferred.resolve(message);
                    } else {
                        // handle this
                    }
                }
            }
        } 
    };
}

DiameterSession.prototype.bindToSocket = function(socket) {
    this.socket = socket;
    socket.on('data', this.socketDataHandler);
};

DiameterSession.prototype.application = function(applicationName) {
    var application = diameterCodec.findApplication(applicationName);
    this.applications[application.id] = new DiameterApplication();
    return this.applications[application.id];
};

DiameterSession.prototype.createRequest = function(application, command) {
    return diameterCodec.constructRequest(application, command, this.options.sessionId);
};

DiameterSession.prototype.end = function() {
    this.socket.end();  
};

DiameterSession.prototype.sendRequest = function(request, timeout) {
    var deferred = Q.defer();
    if (this.socket === undefined) {
        deferred.reject('Socket not bound to session.');
        return deferred.promise;
    }
    timeout = timeout || this.options.timeout || 3000;
    request.header.hopByHopId = this.hopByHopIdCounter++;
    if (_.isFunction(this.options.beforeAnyCommand)) {
        this.options.beforeAnyCommand(request, undefined);
    }
    var requestBuffer = diameterCodec.encodeMessage(request);
    this.socket.write(requestBuffer);
    var promise = Q.timeout(deferred.promise, timeout, 'Request timed out');
    this.pendingRequests[request.hopByHopId] = {
        'request': request,
        'deferred': deferred
    };
    return promise;
};

exports.DiameterSession = DiameterSession;
