'use strict';
var diameter = require('../lib/diameter-server');

// ---------------------------------------------------------------------------
// Diameter Server example
// ---------------------------------------------------------------------------

var HOST = '127.0.0.1';
var PORT = 3868;

// First, we create the server object
var server = diameter.createServer();

server.on('request', function(request, response, callback) {
    console.log('RECEIVED: ');
    console.log(diameter.messageToColoredString(request));

    if (request.command === 'Capabilities-Exchange') {
        response.body = response.body.concat([
            ['Result-Code', 'DIAMETER_SUCCESS'],
            ['Origin-Host', 'test.com'],
            ['Origin-Realm', 'com'],
            ['Host-IP-Address', '2001:db8:3312::1'],
            ['Host-IP-Address', '1.2.3.4'],
            ['Vendor-Id', 123],
            ['Product-Name', 'node-diameter']
        ]);
    } else {
        response.body = response.body.concat([
            ['Result-Code', 'DIAMETER_SUCCESS'],
            ['Origin-Host', 'test.com'],
            ['Origin-Realm', 'com'],
            ['Auth-Application-Id', 'Diameter Credit Control'],
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
                    ['CC-Input-Octets', 123],
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
                    ['CC-Input-Octets', 123],
                    ['CC-Output-Octets', 123]
                ]]
            ]]
        ]);
    }

    console.log('RESPONDED: ');
    console.log(diameter.messageToColoredString(response));
    callback(response);
});

server.listen(PORT, HOST);
console.log('Started DIAMETER server on ' + HOST + ':' + PORT);

// ---------------------------------------------------------------------------
// Diameter Client example
// ---------------------------------------------------------------------------
