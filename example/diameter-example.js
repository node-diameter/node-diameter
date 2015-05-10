'use strict';

var diameter = require('../lib/diameter');

var HOST = '127.0.0.1';
var PORT = 3868;

var server = diameter.createServer({
    beforeAnyCommand: function(request, response) {
        console.log('RECEIVED: ');
        console.log(diameter.messageToColoredString(request));
    },
    afterAnyCommand: function(request, response) {
        console.log('RESPONDED: ');
        console.log(diameter.messageToColoredString(response));
    }
});

var commonMessagesApp = server.application('Diameter Common Messages');

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

var creditControlApp = server.application('Diameter Credit Control Application');

creditControlApp.onCommand('Credit-Control', function(request, response, callback) {
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
    callback(request, response);
});

server.listen(PORT, HOST).then(function() {
    console.log('Started DIAMETER server on ' + HOST + ':' + PORT); 
}, console.log);
