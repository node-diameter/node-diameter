'use strict';

var diameter = require('../lib/diameter');


var HOST = '127.0.0.1';
var PORT = 3868;

diameter.createSession({
    beforeAnyCommand: function(request, response) {
        console.log('RECEIVED: ');
        console.log(diameter.messageToColoredString(request));
    },
    afterAnyCommand: function(request, response) {
        console.log('RESPONDED: ');
        console.log(diameter.messageToColoredString(response));
    }
}).then(function(session) {
    var commonMessagesApp = session.application('Diameter Common Messages');
    
    commonMessagesApp.onCommand('Capabilities-Exchange', function(request, response, callback) {
        response.body = response.body.concat([
            ['Result-Code', 'DIAMETER_SUCCESS'],
            ['Origin-Host', 'test.com'],
            ['Origin-Realm', 'com'],
            ['Host-IP-Address', '2001:db8:3312::1'],
            ['Host-IP-Address', '1.2.3.4'],
            ['Vendor-Id', 123],
            ['Product-Name', 'node-diameter']
        ]);
        callback(request, response);
    });
    
    // You can define application by their codes (this is 'Diameter Credit Control Application')
    var creditControlApp = session.application(4); 
    
    creditControlApp.onCommand('Credit-Control', function(request, response, callback) {
        response.body = response.body.concat([
            ['Result-Code', 2001], // You can also define enum values by their integer codes
            [264, 'test.com'], // or AVP names, this is 'Origin-Host'
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
        callback(request, response);
    });
    
    var server = diameter.createServer(session);
    
    server.listen({
        port: PORT,
        host: HOST
    });
    
    console.log('Started DIAMETER server on ' + HOST + ':' + PORT);
}, function(err) {
	throw new Error("Dictionary init failed: " + err);
}).done();
