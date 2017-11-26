'use strict';

var diameter = require('../lib/diameter');


var HOST = '127.0.0.1';
var PORT = 3868;

var options = {
    beforeAnyMessage: diameter.logMessage,
    afterAnyMessage: diameter.logMessage,
};

var server = diameter.createServer(options, function(socket) {
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
        } else if (event.message.command === 'Credit-Control') {
            event.response.body = event.response.body.concat([
                ['Result-Code', 2001], // You can also define enum values by their integer codes
                [264, 'test.com'], // or AVP names, this is 'Origin-Host'
                ['Origin-Realm', 'com'],
                ['Auth-Application-Id', 'Diameter Credit Control Application'],
                ['CC-Request-Type', 'INITIAL_REQUEST'],
                ['CC-Request-Number', 0],
                ['Multiple-Services-Credit-Control', [
                    ['Granted-Service-Unit', [
                        ['CC-Time', 123],
                        ['CC-Money', [
                            ['Unit-Value', [
                                ['Value-Digits', 123],
                                ['Exponent', 1]
                            ]],
                            ['Currency-Code', 1]
                        ]],
                        ['CC-Total-Octets', 123],
                        ['CC-Input-Octets', 123],
                        ['CC-Output-Octets', 123]
                    ]],
                    ['Requested-Service-Unit', [
                        ['CC-Time', 123],
                        ['CC-Money', [
                            ['Unit-Value', [
                                ['Value-Digits', 123],
                                ['Exponent', 1]
                            ]],
                            ['Currency-Code', 1]
                        ]],
                        ['CC-Total-Octets', 123],
                        ['CC-Input-Octets', 123],
                        ['CC-Output-Octets', 123]
                    ]]
                ]]
            ]);
            event.callback(event.response);
        }

        // Example server initiated message
        setTimeout(function() {
            console.log('Sending server initiated message');
            var connection = socket.diameterConnection;
            var request = connection.createRequest('Diameter Common Messages', 'Capabilities-Exchange');
    		request.body = request.body.concat([
    			[ 'Origin-Host', 'gx.pcef.com' ],
    			[ 'Origin-Realm', 'pcef.com' ],
    			[ 'Vendor-Id', 10415 ],
    			[ 'Origin-State-Id', 219081 ],
    			[ 'Supported-Vendor-Id', 10415 ],
    			[ 'Auth-Application-Id', 'Diameter Credit Control Application' ]
    		]);
    		connection.sendRequest(request).then(function(response) {
    			console.log('Got response for server initiated message');
    		}, function(error) {
    			console.log('Error sending request: ' + error);
    		});
        }, 2000);
    });

    socket.on('end', function() {
        console.log('Client disconnected.');
    });
    socket.on('error', function(err) {
        console.log(err);
    });
});

server.listen(PORT, HOST);

console.log('Started DIAMETER server on ' + HOST + ':' + PORT);
