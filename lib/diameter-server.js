'use strict';

var net = require('net');
var events = require('events');
var util = require('util');
var chalk = require('chalk');
var _ = require('lodash');
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
                                socket.write(responseBuffer);
                            }, function(error) {
                                //handle
                                console.log(error);
                            });
                        });
                    }, function(error) {
                        //handle
                        console.log('err' + error);
                    }).done();
                    buffer = buffer.slice(messageLength);
                }
            } 
        });
    });
}
util.inherits(DiameterServer, events.EventEmitter);
exports.DiameterServer = DiameterServer;

DiameterServer.prototype.listen = function(port, host) {
    this.tcpserver.listen(port, host);
} 

exports.createServer = function() {
    return new DiameterServer();
};

exports.messageToColoredString = function(message) {
    var avpsToString = function(avps, indent) {
        var indentString = _.repeat(' ', indent);
        return _.reduce(avps, function(out, avp) {
            out += indentString + chalk.cyan(avp[0]) + ': ';
            if (avp[1] instanceof Array) {
                out += '\n' + avpsToString(avp[1], indent + 2);
            } else {
                if (_.isString(avp[1])) {
                    out += '"' + avp[1] + '"';
                } else {
                    out += avp[1];
                }
                out += '\n';
            }
            return out;
        }, '');
    }
    var messageString = chalk.gray(_.repeat('-', 80)) + '\n';
    messageString += chalk.gray('Application: ' + message.header.applicationId) + '\n';
    
    if (message.header.flags.request) {
        messageString += chalk.yellow(message.command) + '\n';
    } else if (!message.header.flags.request && !message.header.flags.error) {
        messageString += chalk.bold.green(message.command) + '\n';
    } else {
        messageString += chalk.red(message.command) + '\n';
    }

    if (message.header.flags.request) {
        messageString += 'Request [x] ';
    } else {
        messageString += chalk.gray(' [ ] ');
    }
    if (message.header.flags.proxiable) {
        messageString += 'Proxiable [x] ';
    } else {
        messageString += chalk.gray('Proxiable [ ] ');
    }
    if (message.header.flags.error) {
        messageString += 'Error [x] ';
    } else {
        messageString += chalk.gray('Error [ ] ');
    }
    if (message.header.flags.potentiallyRetransmitted) {
        messageString += 'Potentially retransmitted [x] ';
    } else {
        messageString += chalk.gray('Potentially retransmitted [ ] ');
    }
    messageString += '\n';
    messageString += chalk.gray(_.repeat('-', 80)) + '\n';
    messageString += avpsToString(message.body, 0);
    messageString += chalk.gray(_.repeat('-', 80));
    return messageString;
}