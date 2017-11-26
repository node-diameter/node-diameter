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
    var connection = socket.diameterConnection;
    var request = connection.createRequest('Diameter Common Messages', 'Capabilities-Exchange');
    request.body = request.body.concat([
        [ 'Origin-Host', 'gx.pcef.example.com' ],
        [ 'Origin-Realm', 'pcef.example.com' ],
        [ 'Vendor-Id', 10415 ],
        [ 'Origin-State-Id', 219081 ],
        [ 'Supported-Vendor-Id', 10415 ],
        [ 'Auth-Application-Id', 'Diameter Credit Control Application' ]
    ]);
    connection.sendRequest(request).then(function(response) {
        // handle response
    }, function(error) {
        console.log('Error sending request: ' + error);
    });
});

// Handling server initiated messages:
socket.on('diameterMessage', function(event) {
    console.log('Received server initiated message');
    if (event.message.command === 'Capabilities-Exchange') {
        event.response.body = event.response.body.concat([
            ['Result-Code', 'DIAMETER_SUCCESS'],
            ['Origin-Host', 'gx.pcrf.example.com'],
            ['Origin-Realm', 'pcrf.example.com'],
            ['Host-IP-Address', '2001:db8:3312::1'],
            ['Host-IP-Address', '1.2.3.4'],
            ['Vendor-Id', 123],
            ['Product-Name', 'node-diameter']
        ]);
        event.callback(event.response);
        // socket.diameterConnection.end();
    }
});
socket.on('error', function(err) {
    console.log(err);
});
