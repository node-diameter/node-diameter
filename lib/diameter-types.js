'use strict';

var _ = require('lodash');
var Q = require('q');
var util = require('util');

var types = {
    'OctetString': {
        encode: function(value) {

        },
        decode: function(buffer) {
            return buffer.toString('utf-8');
        }
    },
    'Unsigned32': {
        encode: function(value) {

        },
        decode: function(buffer) {
            return buffer.readUInt32BE(0);
        }
    }
}

exports.decode = function(type, buffer) {
    return types[type].decode(buffer);
}