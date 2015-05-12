'use strict';

var chalk = require('chalk');
var _ = require('lodash');


var BITS_IN_BYTE = 8;

exports.random32BitNumber = function() {
    var max32 = Math.pow(2, 32) - 1
    return Math.floor(Math.random() * max32);
};

exports.bitsToBytes = function(bits) {
    return bits * BITS_IN_BYTE;
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
