'use strict';

var net = require('net');
var _ = require('lodash');
var diameterCodec = require('./diameter-codec');
var diameterUtil = require('./diameter-util');
var Q = require('q');


var DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES = 20;

function DiameterApplication(diameterServer) {
    if (!(this instanceof DiameterApplication)) {
        return new DiameterApplication();
    }    
    var self = this;
    self.diameterServer = diameterServer;
    self.commandHandlers = {};
}

DiameterApplication.prototype.onCommand = function(commandName, handlerFunction) {
    this.commandHandlers[commandName] = handlerFunction;
};

DiameterApplication.prototype.handleRequest = function(request, response, callback) {
    var handlerFunction = this.commandHandlers[request.command];
    handlerFunction(request, response, callback);
};

function DiameterServer(options) {
    if (!(this instanceof DiameterServer)) {
        return new DiameterServer(options);
    }    

    var self = this;
    self.applications = {};
    self.options = options;

    this.tcpserver = net.createServer(function(socket) {
        var buffer = new Buffer(0, 'hex');

        socket.on('data', function(data) {
            buffer = Buffer.concat([buffer, new Buffer(data, 'hex')]);
        
            // If we collected header
            if (diameterUtil.bitsToBytes(buffer.length) >= DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES) {
                var messageLength = diameterCodec.decodeMessageHeader(buffer).header.length;
                // If we collected the entire message
                if (diameterUtil.bitsToBytes(buffer.length) >= messageLength) {
                    var message = diameterCodec.decodeMessage(buffer);
                    var response = diameterCodec.constructResponse(message);
                    var application = self.applications[message.header.application];
                    if (_.isFunction(self.options.beforeAnyCommand)) {
                        self.options.beforeAnyCommand(message, response);
                    }
                    application.handleRequest(message, response, function(request, response) {
                        if (_.isFunction(self.options.afterAnyCommand)) {
                            self.options.afterAnyCommand(message, response);
                        }
                        var responseBuffer = diameterCodec.encodeMessage(response);
                        socket.write(responseBuffer);
                    });
                    buffer = buffer.slice(messageLength);
                }
            } 
        });
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

DiameterServer.prototype.application = function(applicationName) {
    var application = new DiameterApplication(this);
    this.applications[applicationName] = application;
    return application;
};

exports.DiameterServer = DiameterServer;
