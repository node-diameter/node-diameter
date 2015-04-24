'use strict';

var net = require('net');
var events = require('events');
var util = require('util');

var readUInt24BE = function(buffer, offset) {
    return buffer.readUInt8(offset) * 256 * 256 + buffer.readUInt8(offset + 1) * 256 + buffer.readUInt8(offset + 2);
};

var getBit = function(num, bit) {
    return num.toString(2)[bit] === '1';
};

var decodeMessage = function(buffer) {
    var message = {};
    message.version = buffer.readUInt8(0);
    message.length = readUInt24BE(buffer, 1);
    message.commandCode = readUInt24BE(buffer, 5);
    message.flags = {
        request: getBit(buffer.readUInt8(4), 0),
        proxiable: getBit(buffer.readUInt8(4), 1),
        error: getBit(buffer.readUInt8(4), 2),
        potentiallyRetransmitted: getBit(buffer.readUInt8(4), 3)
    };
    message.applicationId = buffer.readUInt32BE(8);
    message.hopByHopId = buffer.readUInt32BE(12);
    message.endToEndId = buffer.readUInt32BE(16);
    message.avps = [];

    var cursor = 20;
    while(cursor <= message.length) {
        console.log(cursor);
        var avp = decodeAvp(buffer, cursor);
        console.log(avp);
        message.avps.push(avp);
        cursor += avp.length; // TODO this won't work for grouped
    }

    return message;
};

var decodeAvp = function(buffer, start) {
    var avp = {};
    avp.code = buffer.readUInt32BE(start + 0);
    avp.flags = {
        vendor: getBit(buffer.readUInt8(start + 4), 0),
        mandatory: getBit(buffer.readUInt8(start + 4), 1)
    };
    avp.length = readUInt24BE(buffer, start + 5);
    return avp;
};

function DiameterServer(connectionListener) {
    if (!(this instanceof DiameterServer)) {
        return new DiameterServer(connectionListener);
    }    

    var self = this;

    this.tcpserver = net.createServer(function(socket) {
        var buffer = new Buffer(0, 'hex');

        socket.on('data', function(data) {
            buffer = Buffer.concat([buffer, new Buffer(data, 'hex')]);
		
			// If we collected header
			if (buffer.length * 8 >= 20) {
				var messageLength = readUInt24BE(buffer, 1);
                // If we collected the entire message
				if (buffer.length * 8 >= messageLength) {
                    var message = decodeMessage(buffer);
                    console.log(message);
                    buffer = buffer.slice(messageLength);
                }
			} 
		});
    });
}
util.inherits(DiameterServer, events.EventEmitter);
exports.DiameterServer = DiameterServer;

exports.createServer = function(connectionListener) {
	return new DiameterServer(connectionListener);
};

DiameterServer.prototype.listen = function(port, host) {
    this.tcpserver.listen(port, host);
} 
