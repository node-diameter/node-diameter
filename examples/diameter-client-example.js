'use strict';

var diameter = require('../lib/diameter');


var HOST = '127.0.0.1';
var PORT = 3868;

var options = {
    beforeAnyMessage: diameter.logMessage,
    afterAnyMessage: diameter.logMessage,
    port: PORT,
    host: HOST
};

var socket = diameter.createConnection(options, function() {
    var session = socket.diameterSession;
    var request = session.createRequest('Diameter Common Messages', 'Capabilities-Exchange');
    request.body = request.body.concat([ 
        [ 'Origin-Host', 'gx.pcef.com' ],
        [ 'Origin-Realm', 'pcef.com' ],
        [ 'Vendor-Id', 10415 ],
        [ 'Origin-State-Id', 219081 ],
        [ 'Supported-Vendor-Id', 10415 ],
        [ 'Auth-Application-Id', 'Diameter Credit Control' ] 
    ]);
    session.sendRequest(request).then(function(response) {
        // handle response
    }, function(error) {
        console.log('Error sending request: ' + error);
    });
});

// Handling server initiated messages:
socket.on('diameterMessage', function(event) {
    if (event.message.command === 'Capabilities-Exchange') {
        event.response.body = event.response.body.concat([
            ['Result-Code', 'DIAMETER_SUCCESS'],
            ['Origin-Host', 'test.com'],
            ['Origin-Realm', 'com'],
            ['Host-IP-Address', '2001:db8:3312::1'],
            ['Host-IP-Address', '1.2.3.4'],
            ['Vendor-Id', 123],
            ['Product-Name', 'node-diameter']
        ]);
        event.callback(event.response);
        socket.diameterSession.end();
    }
});
socket.on('error', function(err) {
    console.log(err);
});
