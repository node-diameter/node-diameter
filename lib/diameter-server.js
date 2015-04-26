'use strict';

var net = require('net');
var events = require('events');
var util = require('util');
var diameterCodec = require('./diameter-codec');


var BITS_IN_BYTE = 8;
var DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES = 20;

var bitsToBytes = function(bits) {
    return bits * BITS_IN_BYTE;
}

function DiameterServer() {
    if (!(this instanceof DiameterServer)) {
        return new DiameterServer();
    }    

    var self = this;

    events.EventEmitter.call(this);

    this.tcpserver = net.createServer(function(socket) {
        var buffer = new Buffer(0, 'hex');

        socket.on('data', function(data) {
            buffer = Buffer.concat([buffer, new Buffer(data, 'hex')]);
        
            // If we collected header
            if (bitsToBytes(buffer.length) >= DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES) {
                var messageLength = diameterCodec.decodeMessageHeader(buffer).header.length;
                // If we collected the entire message
                if (bitsToBytes(buffer.length) >= messageLength) {
                    diameterCodec.decodeMessage(buffer).then(function(message) {
                        self.emit('request', message, diameterCodec.constructResponse(message), 
                            function(response) {
                            diameterCodec.encodeMessage(response).then(function(responseBuffer) {
                                diameterCodec.decodeMessage(responseBuffer).then(console.log, console.log);
                                socket.write(responseBuffer);
                            }, function(error) {
                                //handle
                                console.log(error);
                            });
                        });
                    }, function(error) {
                        //handle
                        console.log('err' + error);
                    });
                    buffer = buffer.slice(messageLength);
                }
            } 
        });
    });
}
util.inherits(DiameterServer, events.EventEmitter);
exports.DiameterServer = DiameterServer;

exports.createServer = function() {
    return new DiameterServer();
};

DiameterServer.prototype.listen = function(port, host) {
    this.tcpserver.listen(port, host);
} 
