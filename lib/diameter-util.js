'use strict';

var chalk = require('chalk');
var _ = require('lodash');


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
};
