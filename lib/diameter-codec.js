'use strict';

var net = require('net');
var events = require('events');
var util = require('util');
var _ = require('lodash');
var diameterDictionary = require('./diameter-dictionary');
var Q = require('q');
var diameterTypes = require('./diameter-types');


var DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES = 20;
var DIAMETER_MESSAGE_AVP_HEADER_LENGTH_IN_BYTES = 8;

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

// wow, this is terrible.. must change
var writeUInt24BE = function(buffer, offset, value) {
    var i = Math.floor(value / (256 * 256));
    buffer.writeUInt8(i, offset);
    value = value % (256 * 256);
    i = Math.floor(value / (256));
    buffer.writeUInt8(Math.floor(value / 256), offset + 1);
    value = value % 256;
    buffer.writeUInt8(value, offset + 2);
};

var getBit = function(num, bit) {
    return ((num>>(7 - bit)) % 2 != 0);
};

// another beauty..
var getIntFromBits = function(array) {
    var s = '';
    _.each(array, function(bit) {
        s += bit ? '1' : '0';
    });
    return parseInt(s, 2);
}

exports.decodeMessageHeader = function(buffer) {
    var message = {
        _timeReceived: _.now(),
        header: {},
        body: []
    };
    message.header.version = buffer.readUInt8(DIAMETER_MESSAGE_HEADER_VERSION);
    message.header.length = readUInt24BE(buffer, DIAMETER_MESSAGE_HEADER_LENGTH);
    message.header.commandCode = readUInt24BE(buffer, DIAMETER_MESSAGE_HEADER_COMMAND_CODE);
    var flags = buffer.readUInt8(DIAMETER_MESSAGE_HEADER_FLAGS);
    message.header.flags = {
        request: getBit(flags, DIAMETER_MESSAGE_HEADER_FLAG_REQUEST),
        proxiable: getBit(flags, DIAMETER_MESSAGE_HEADER_FLAG_PROXIABLE),
        error: getBit(flags, DIAMETER_MESSAGE_HEADER_FLAG_ERROR),
        potentiallyRetransmitted: getBit(flags, DIAMETER_MESSAGE_HEADER_FLAG_POTENTIALLY_RETRANSMITTED)
    };
    message.header.applicationId = buffer.readUInt32BE(DIAMETER_MESSAGE_HEADER_APPLICATION_ID);
    message.header.hopByHopId = buffer.readUInt32BE(DIAMETER_MESSAGE_HEADER_HOP_BY_HOP_ID);
    message.header.endToEndId = buffer.readUInt32BE(DIAMETER_MESSAGE_HEADER_END_TO_END_ID);
    return message;
};

var inflateMessageHeader = function(message) {
    var deferred = Q.defer();

    diameterDictionary.getCommandByCode(message.header.applicationId, message.header.commandCode).then(function(command) {
        message.command = command.name;
        deferred.resolve(message);
    }, deferred.reject);

    return deferred.promise;
}

exports.constructResponse = function(message) {
    var response = {
        header: {
            version: message.header.version,
            commandCode: message.header.commandCode,
            flags: {
                request: false,
                proxiable: message.header.flags.proxiable,
                error: false,
                potentiallyRetransmitted: message.header.flags.potentiallyRetransmitted
            },
            applicationId: message.header.applicationId,
            hopByHopId: message.header.hopByHopId,
            endToEndId: message.header.endToEndId
        },
        body: [],
        command: message.command
    };

    var sessionId = _.find(message.body, function(avp) {
                return avp[0] === 'Session-Id';
            });
    if (sessionId) {
        response.body.push(['Session-Id', sessionId[1]]);
    }
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
        if (avpTag.grouped) {
            Q.all(decodeAvps(avp.dataRaw, 0, avp.dataRaw.length, appId)).then(function(results) {
                avp.avps = results;
                deferred.resolve(avp);
            }, deferred.reject).done();
        } else {
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
            }, deferred.reject).done();
        }
    }, deferred.reject);

    return deferred.promise;
};

var decodeAvps = function(buffer, start, end, appId) {
    var promises = [];
    var cursor = start;
    while(cursor < end) {
        var avp = decodeAvpHeader(buffer, cursor);
        var avpPromise = decodeAvp(buffer, cursor, appId);
        promises.push(avpPromise);
        cursor += avp.length;
        if (cursor % 4 != 0) {
            cursor += 4 - cursor % 4; // round to next 32 bit
        }
    }
    return promises;
};

// Converts avp objects to array form, e.g. [['key', 'value'], ['key', 'value']]
var avpsToArrayForm = function(avps) {
    return _.map(avps, function(avp) {
        if (avp.avps) {
            return [avp.code, avpsToArrayForm(avp.avps)];
        }
        return [avp.code, avp.data];
    });
};

exports.decodeMessage = function(buffer) {
    var deferred = Q.defer();
    var message = exports.decodeMessageHeader(buffer);

    var avpPromises = decodeAvps(buffer, DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES, 
        message.header.length, message.header.applicationId);
    var promises = _.flatten([inflateMessageHeader(message), avpPromises]);
    
    Q.all(promises).then(function(results) {
        _.pullAt(results, 0);
        message.body = avpsToArrayForm(results);
        message._timeProcessed = _.now();
        deferred.resolve(message);
    }, deferred.reject);

    return deferred.promise;
};

var encodeAvps = function(avps, appId) {
    var deferred = Q.defer();
    
    var promises = _.map(avps, function(avp) {
        return encodeAvp(avp, appId);
    });

    Q.all(promises).then(function(results) {
        var buffer = Buffer.concat(results);
        deferred.resolve(buffer);
    }, deferred.reject);

    return deferred.promise;
};

var encodeAvp = function(avp, appId) {
    var deferred = Q.defer();

    diameterDictionary.getAvpByName(appId, avp[0]).then(function(avpTag) {
        var value = avp[1];
        var avpDataBufferPromise;
        if (avpTag.grouped) {
            avpDataBufferPromise = encodeAvps(value, appId);
        } else {
            avpDataBufferPromise = diameterDictionary.resolveToBaseType(avpTag.type, appId).then(function(type) {
                if (avpTag.enums) {
                    var enumCode = _.find(avpTag.enums, {name: value});
                    if (enumCode == null) {
                        deferred.reject('Invalid enum value ' + value + ' for ' + avpTag.name);
                        return null;
                    }
                    value = enumCode.code;
                }
                return diameterTypes.encode(type, value);
            }, deferred.reject);
        }
        avpDataBufferPromise.then(function(avpDataBuffer) {
            var avpHeaderBuffer = new Buffer(DIAMETER_MESSAGE_AVP_HEADER_LENGTH_IN_BYTES);
            avpHeaderBuffer.writeUInt32BE(_.parseInt(avpTag.code, DIAMETER_MESSAGE_AVP_CODE));
            // TODO handle these flags
            avpHeaderBuffer.writeUInt8(getIntFromBits(_.values([false, false, false])), DIAMETER_MESSAGE_AVP_FLAGS);
            writeUInt24BE(avpHeaderBuffer, DIAMETER_MESSAGE_AVP_LENGTH, avpDataBuffer.length + avpHeaderBuffer.length);

            if (avpDataBuffer.length % 4 != 0) {
                var filler = new Buffer(4 - avpDataBuffer.length % 4);
                filler.fill(0);
                avpDataBuffer = Buffer.concat([avpDataBuffer, filler]);
            }
            deferred.resolve(Buffer.concat([avpHeaderBuffer, avpDataBuffer]));
        }, deferred.reject).done();
    }, deferred.reject);

    return deferred.promise;
};

exports.encodeMessage = function(message) {
    var deferred = Q.defer();
    
    var buffer = new Buffer(DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES, 'hex');
    buffer.writeUInt8(message.header.version, DIAMETER_MESSAGE_HEADER_VERSION);
    writeUInt24BE(buffer, DIAMETER_MESSAGE_HEADER_COMMAND_CODE, message.header.commandCode);
    buffer.writeUInt8(getIntFromBits(_.values(message.header.flags)), DIAMETER_MESSAGE_HEADER_FLAGS);
    buffer.writeUInt32BE(message.header.applicationId, DIAMETER_MESSAGE_HEADER_APPLICATION_ID);
    buffer.writeUInt32BE(message.header.hopByHopId, DIAMETER_MESSAGE_HEADER_HOP_BY_HOP_ID);
    buffer.writeUInt32BE(message.header.endToEndId, DIAMETER_MESSAGE_HEADER_END_TO_END_ID);

    var promises = _.map(message.body, function(avp) {
        return encodeAvp(avp, message.header.applicationId);
    });
    Q.all(promises).then(function(results) {
        buffer = Buffer.concat(_.flatten([buffer, results]));
        writeUInt24BE(buffer, DIAMETER_MESSAGE_HEADER_LENGTH, buffer.length);
        deferred.resolve(buffer);
    }, deferred.reject);

    return deferred.promise;
};
