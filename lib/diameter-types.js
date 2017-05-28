'use strict';

var _ = require('lodash');
var Long = require('long');
var ipaddr = require('ipaddr.js');


var types = {
    'OctetString': {
        encode: function(value) {
            return value;
        },
        decode: function(buffer) {
            return buffer;
        }
    },
    'UTF8String': {
        encode: function(value) {
            return new Buffer(value, 'utf-8');
        },
        decode: function(buffer) {
            return buffer.toString('utf-8');
        }
    },
    'Unsigned32': {
        encode: function(value) {
            var buffer = new Buffer(4);
            buffer.writeUInt32BE(parseInt(value, 10), 0);
            return buffer;
        },
        decode: function(buffer) {
            return buffer.readUInt32BE(0);
        }
    },
    'Integer32': {
        encode: function(value) {
            var buffer = new Buffer(4);
            buffer.writeInt32BE(parseInt(value, 10), 0);
            return buffer;
        },
        decode: function(buffer) {
            return buffer.readInt32BE(0);
        }
    },
    'Unsigned64': {
        encode: function(value) {
            var buffer = new Buffer(8);
            if (value instanceof Long) {
                buffer.writeUInt32BE(value.high, 0);
                buffer.writeUInt32BE(value.low, 4);
            } else {
                buffer.writeUInt32BE(0, 0);
                buffer.writeUInt32BE(value, 4);
            }
            return buffer;
        },
        decode: function(buffer) {
            return new Long(buffer.readUInt32BE(4), buffer.readUInt32BE(0));
        }
    },
    'Integer64': {
        encode: function(value) {
            var buffer = new Buffer(8);
            if (value instanceof Long) {
                buffer.writeInt32BE(value.high, 0);
                buffer.writeInt32BE(value.low, 4);
            } else {
                buffer.writeInt32BE(0, 0);
                buffer.writeInt32BE(value, 4);
            }
            return buffer;
        },
        decode: function(buffer) {
            return new Long(buffer.readInt32BE(4), buffer.readInt32BE(0));
        }
    },
    'Time': {
        encode: function(value) {
            var buffer = new Buffer(4);
            buffer.writeUInt32BE(parseInt(value, 10), 0);
            return buffer;
        },
        decode: function(buffer) {
            return buffer.readUInt32BE(0);
        }
    },
    'IPAddress': {
        encode: function(value) {
            var ip = ipaddr.parse(value);
            var typeBuffer = new Buffer(2);
            typeBuffer.writeUInt8(0, 0);
            if (ip.kind() === 'ipv4') {
                typeBuffer.writeUInt8(1, 1);
                return Buffer.concat([typeBuffer, new Buffer(ip.toString().split('.'))]);
            } else {
                typeBuffer.writeUInt8(2, 1);
                return Buffer.concat([typeBuffer, new Buffer(ip.toByteArray())]);
            }
        },
        decode: function(buffer) {
            var octetsArray = [];
            for (var i = 0; i < buffer.length; i++) {
                octetsArray.push(buffer.readUInt8(i));
            }
            if (octetsArray.length === 4) {
                return new ipaddr.IPv4(octetsArray).toString();
            } else if (octetsArray.length === 6) {
                return new ipaddr.IPv4(_.takeRight(octetsArray, 4)).toString();
            } else {
                if (octetsArray.length > 16) {
                    octetsArray = _.takeRight(octetsArray, 16);
                }
                var parts = new Array(8);
                _.fill(parts, 0);
                _.each(octetsArray, function(octet, i) {
                    var factor = i % 2 === 0 ? 256 : 1;
                    parts[Math.floor(i / 2)] += octet * factor;
                });
                return new ipaddr.IPv6(parts).toString();
            }
        }
    }
};

var getType = function(type) {
    var handler = types[type];
    if (handler == null) {
        throw new Error('No handler for type: ' + type);
    }
    return handler;
};

exports.getParsableTypes = function() {
    return _.keys(types);
};

exports.decode = function(type, buffer) {
    return getType(type).decode(buffer);
};

exports.encode = function(type, value) {
    return getType(type).encode(value);
};
