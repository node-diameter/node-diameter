'use strict';

var net = require('net');
var _ = require('lodash');


var DIAMETER_MESSAGE_HEADER_LENGTH_IN_BYTES = 20;


function DiameterServer(session) {
    if (!(this instanceof DiameterServer)) {
        return new DiameterServer(session);
    }    

    var self = this;
    self.session = session;

    this.tcpserver = net.createServer(function(socket) {
        self.session.bindToSocket(socket);
    });
}

DiameterServer.prototype.listen = function(options) {
    if (options.host == null) {
        throw new Error('Host not specified');
    }
    if (options.port == null) {
        throw new Error('Port not specified');
    }
    this.tcpserver.listen(options.port, options.host);
};


exports.DiameterServer = DiameterServer;
