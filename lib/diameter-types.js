'use strict';

var _ = require('lodash');
var Q = require('q');
var util = require('util');
var Buffer = require('buffer').Buffer;
var Long = require("long");


var types = {
    'OctetString': {
        encode: function(value) {
            return new Buffer(value, 'utf-8');
        },
        decode: function(buffer) {
            return buffer.toString('utf-8');
        }
    },
    'Unsigned32': {
        encode: function(value) {
            var buffer = new Buffer(4, 'hex');
            buffer.writeUInt32BE(parseInt(value, 10), 0);
            return buffer;
        },
        decode: function(buffer) {
            return buffer.readUInt32BE(0);
        }
    },
    'Integer32': {
        encode: function(value) {
            var buffer = new Buffer(4, 'hex');
            buffer.writeInt32BE(parseInt(value, 10), 0);
            return buffer;
        },
        decode: function(buffer) {
            return buffer.readInt32BE(0);
        }
    },
    'Unsigned64': {
        encode: function(value) {
            var buffer = new Buffer(8, 'hex');
            if (value instanceof Long) {
                buffer.writeUInt32BE(value.high, 4);
                buffer.writeUInt32BE(value.low, 0);
            } else {
                buffer.writeUInt32BE(0, 4);
                buffer.writeUInt32BE(value, 0);
            }
            return buffer;
        },
        decode: function(buffer) {
            return new Long(buffer.readUInt32BE(4), buffer.readUInt32BE(0));
        }
    },
    'Integer64': {
        encode: function(value) {
            var buffer = new Buffer(8, 'hex');
            if (value instanceof Long) {
                buffer.writeInt32BE(value.high, 4);
                buffer.writeInt32BE(value.low, 0);
            } else {
                buffer.writeInt32BE(0, 4);
                buffer.writeInt32BE(value, 0);
            }
            return buffer;
        },
        decode: function(buffer) {
            return new Long(buffer.readInt32BE(4), buffer.readInt32BE(0));
        }
    },
    'Time': {
        encode: function(value) {
            var buffer = new Buffer(4, 'hex');
            buffer.writeUInt32BE(parseInt(value, 10), 0);
            return buffer;
        },
        decode: function(buffer) {
            return buffer.readUInt32BE(0);
        }
    },
}

exports.decode = function(type, buffer) {
    var handler = types[type];
    if (handler == null) throw new Error('No handler for type: ' + type);
    return handler.decode(buffer);
}

exports.encode = function(type, value) {
    var handler = types[type];
    if (handler == null) throw new Error('No handler for type: ' + type);
    return handler.encode(value);
}