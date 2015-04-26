'use strict';

var _ = require('lodash');
var Q = require('q');
var util = require('util');
var Buffer = require('buffer').Buffer;

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
            var buffer = new Buffer(4, 'hex');
            buffer.writeUInt64BE(parseInt(value, 10), 0);
            return buffer;
        },
        decode: function(buffer) {
            return buffer.readUInt64BE(0);
        }
    },
    'Integer64': {
        encode: function(value) {
            var buffer = new Buffer(4, 'hex');
            buffer.writeInt64BE(parseInt(value, 10), 0);
            return buffer;
        },
        decode: function(buffer) {
            return buffer.readInt64BE(0);
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
    return types[type].decode(buffer);
}

exports.encode = function(type, value) {
    return types[type].encode(value);
}