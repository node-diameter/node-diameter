'use strict';

var chalk = require('chalk');
var _ = require('lodash');


exports.random32BitNumber = function() {
    var max32 = Math.pow(2, 32) - 1;
    return Math.floor(Math.random() * max32);
};

var avpsToString = function(avps, indent) {
    var indentString = _.repeat(' ', indent);
    return _.reduce(avps, function(out, avp) {
        out += indentString + chalk.cyan(avp[0]) + ': ';
        if (avp[1] instanceof Array) {
            out += '\n' + avpsToString(avp[1], indent + 2);
        } else {
            if (_.isString(avp[1])) {
                out += '"' + avp[1] + '"';
            } else if (Buffer.isBuffer(avp[1])) {
                out += '0x' + avp[1].toString('hex');
            } else {
                out += avp[1];
            }
            out += '\n';
        }
        return out;
    }, '');
};

var flagsToString = function(flags) {
    var messageString = '';
    _.each(_.keys(flags), function(key) {
        if (flags[key]) {
            messageString += _.startCase(key) + ' [x]  ';
        } else {
            messageString += chalk.gray(_.startCase(key) + ' [ ]  ');
        }
    });
    return messageString;
};

exports.messageToColoredString = function(message) {
    var messageString = chalk.gray(_.repeat('-', 80)) + '\n';
    messageString += chalk.gray('Application: ' + message.header.application) + '\n';

    if (message.header.flags.request) {
        messageString += chalk.yellow(message.command) + '\n';
    } else if (!message.header.flags.request && !message.header.flags.error) {
        messageString += chalk.bold.green(message.command) + '\n';
    } else {
        messageString += chalk.red(message.command) + '\n';
    }

    messageString += flagsToString(message.header.flags);

    messageString += '\n';
    messageString += chalk.gray(_.repeat('-', 80)) + '\n';
    messageString += avpsToString(message.body, 0);
    messageString += chalk.gray(_.repeat('-', 80));
    return messageString;
};

var getPathElements = function(path) {
    var pathElements = [];
    if (path === undefined || path === null) return pathElements;
    return path.split('.').map(function(pathElement) {
        var parts = /([^[]+)\[(\d)\]$/.exec(pathElement);
        if (parts !== null) { // element has an array index, e.g. Some-Avp[1]
            return {
                name: parts[1],
                index: parts[2]
            }
        } else {
            return {
                index: 0,
                name: pathElement
            }
        }
    });
};

exports.getAvpValue = function(message, path) {
    var pathElements = getPathElements(path);
    if (pathElements.length === 0) return undefined;
    var firstAvpName = pathElements[0].name;
    var avps = _.filter(message, function(avp) {
        return avp[0] === firstAvpName
    });

    if (avps.length > 0) {
        if (pathElements[0].index === 0 && avps.length > 1) {
            throw new Error('Can\'t resolve path, multiple AVPs found with name \'' + firstAvpName + '\'');
        }
        if (pathElements[0].index >= avps.length) {
            throw new Error('Can\'t resolve path, index for \'' + firstAvpName + '\' is out of bounds');
        }
        
        if (pathElements.length === 1) {
            return avps[pathElements[0].index][1];
        } else {
            return exports.getAvpValue(avps[pathElements[0].index][1], path.substring(path.indexOf('.') + 1, path.length));        
        }
    }
    return undefined;
};