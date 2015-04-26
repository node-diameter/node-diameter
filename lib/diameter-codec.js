'use strict';

var net = require('net');
var events = require('events');
var util = require('util');
var _ = require('lodash');
var diameterDictionary = require('./diameter-dictionary');
var Q = require('q');
var diameterTypes = require('./diameter-types');


var DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES = 20;

// Byte positions for header fields
var DIAMETER_MESSAGE_HEADER_VERSION = 0;
var DIAMETER_MESSAGE_HEADER_LENGTH = 1;
var DIAMETER_MESSAGE_HEADER_COMMAND_CODE = 5;
var DIAMETER_MESSAGE_HEADER_FLAGS = 4;
var DIAMETER_MESSAGE_HEADER_FLAG_REQUEST = 0;
var DIAMETER_MESSAGE_HEADER_FLAG_PROXIABLE = 1;
var DIAMETER_MESSAGE_HEADER_FLAG_ERROR = 2;
var DIAMETER_MESSAGE_HEADER_FLAG_POTENTIALLY_RETRANSMITTED = 3;
var DIAMETER_MESSAGE_HEADER_APPLICATION_ID = 8;
var DIAMETER_MESSAGE_HEADER_HOP_BY_HOP_ID = 12;
var DIAMETER_MESSAGE_HEADER_END_TO_END_ID = 16;

// Byte postions for AVP fields
var DIAMETER_MESSAGE_AVP_CODE = 0;
var DIAMETER_MESSAGE_AVP_FLAGS = 4;
var DIAMETER_MESSAGE_AVP_FLAG_VENDOR = 0;
var DIAMETER_MESSAGE_AVP_FLAG_MANDATORY = 1;
var DIAMETER_MESSAGE_AVP_LENGTH = 5;
var DIAMETER_MESSAGE_AVP_VENDOR_ID = 8;
var DIAMETER_MESSAGE_AVP_VENDOR_ID_DATA = 12;
var DIAMETER_MESSAGE_AVP_NO_VENDOR_ID_DATA = 8;

var readUInt24BE = function(buffer, offset) {
    return buffer.readUInt8(offset) * 256 * 256 + buffer.readUInt8(offset + 1) * 256 + buffer.readUInt8(offset + 2);
};

var getBit = function(num, bit) {
    return num.toString(2)[bit] === '1';
};

exports.decodeMessageHeader = function(buffer) {
    var message = {
        _timeReceived: _.now()
    };
    message.version = buffer.readUInt8(DIAMETER_MESSAGE_HEADER_VERSION);
    message.length = readUInt24BE(buffer, DIAMETER_MESSAGE_HEADER_LENGTH);
    message.commandCodeInt = readUInt24BE(buffer, DIAMETER_MESSAGE_HEADER_COMMAND_CODE);
    var flags = buffer.readUInt8(DIAMETER_MESSAGE_HEADER_FLAGS);
    message.flags = {
        request: getBit(flags, DIAMETER_MESSAGE_HEADER_FLAG_REQUEST),
        proxiable: getBit(flags, DIAMETER_MESSAGE_HEADER_FLAG_PROXIABLE),
        error: getBit(flags, DIAMETER_MESSAGE_HEADER_FLAG_ERROR),
        potentiallyRetransmitted: getBit(flags, DIAMETER_MESSAGE_HEADER_FLAG_POTENTIALLY_RETRANSMITTED)
    };
    message.applicationId = buffer.readUInt32BE(DIAMETER_MESSAGE_HEADER_APPLICATION_ID);
    message.hopByHopId = buffer.readUInt32BE(DIAMETER_MESSAGE_HEADER_HOP_BY_HOP_ID);
    message.endToEndId = buffer.readUInt32BE(DIAMETER_MESSAGE_HEADER_END_TO_END_ID);
    message.avps = [];

    return message;
};

var inflateMessageHeader = function(message) {
    var deferred = Q.defer();

    diameterDictionary.getCommandByCode(message.applicationId, message.commandCodeInt).then(function(command) {
        message.commandCode = command.name;
        deferred.resolve(message);
    }, deferred.reject);

    return deferred.promise;
}

exports.constructResponse = function(message) {
    var response = {
        version: message.version,
        commandCode: message.commandCodeInt,
        flags: {
            request: false,
            proxiable: message.proxiable,
            error: false,
            potentiallyRetransmitted: message.potentiallyRetransmitted
        },
        applicationId: message.applicationId,
        hopByHopId: message.hopByHopId,
        endToEndId: message.endToEndId
    };

    return response;
};

var decodeAvpHeader = function(buffer, start) {
    var avp = {};
    avp.codeInt = buffer.readUInt32BE(start + DIAMETER_MESSAGE_AVP_CODE);
    var flags = buffer.readUInt8(start + DIAMETER_MESSAGE_AVP_FLAGS);
    avp.flags = {
        vendor: getBit(flags, DIAMETER_MESSAGE_AVP_FLAG_VENDOR),
        mandatory: getBit(flags, DIAMETER_MESSAGE_AVP_FLAG_MANDATORY)
    };
    avp.length = readUInt24BE(buffer, start + DIAMETER_MESSAGE_AVP_LENGTH);
    
    return avp;
};

var decodeAvp = function(buffer, start, appId) {
    var deferred = Q.defer();
    var avp = decodeAvpHeader(buffer, start);
    diameterDictionary.getAvpByCode(appId, avp.codeInt).then(function(avpTag) {
        avp.code = avpTag.name;
        
        var hasVendorId = avp.flags.vendor && avpTag['vendor-bit'] != 'mustnot';
        if (hasVendorId) {
            avp.vendorId = buffer.readUInt32BE(start + DIAMETER_MESSAGE_AVP_VENDOR_ID);
        }
        var dataPosition = hasVendorId ? DIAMETER_MESSAGE_AVP_VENDOR_ID_DATA : DIAMETER_MESSAGE_AVP_NO_VENDOR_ID_DATA;
        avp.dataRaw = buffer.slice(start + dataPosition, start + avp.length);
        diameterDictionary.resolveToBaseType(avpTag.type, appId).then(function(type) {
            avp.data = diameterTypes.decode(type, avp.dataRaw);
            if (avpTag.enums) {
                var enumValue = _.find(avpTag.enums, {code: avp.data.toString()});
                if (enumValue == null) {
                    deferred.reject('No enum value found for ' + avp.code + ' code ' + avp.data);
                    return;
                }
                avp.data = enumValue.name;
            }
            deferred.resolve(avp);
        }, deferred.reject);
    }, deferred.reject);

    return deferred.promise;
};

exports.decodeMessage = function(buffer) {
    var deferred = Q.defer();
    var message = exports.decodeMessageHeader(buffer);

    var promises = [inflateMessageHeader(message)];

    var cursor = DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES;
    while(cursor < message.length) {
        var avp = decodeAvpHeader(buffer, cursor);
        var avpPromise = decodeAvp(buffer, cursor, message.applicationId);
        promises.push(avpPromise);
        cursor += avp.length;
        if (cursor % 4 != 0) {
            cursor += 4 - cursor % 4; // round to next 32 bit
        }
    }

    Q.all(promises).then(function(results) {
        _.pullAt(results, 0);
        message.avps = _.map(results, function(avp) {
            return [avp.code, avp.data];
        })
        message._timeProcessed = _.now();
        deferred.resolve(message);
    }, deferred.reject);

    return deferred.promise;
};
