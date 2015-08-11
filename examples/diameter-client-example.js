'use strict';

var diameter = require('../lib/diameter');


var HOST = '127.0.0.1';
var PORT = 3868;
  
diameter.connect({host: HOST, port: PORT}).then(function(session) {
	var request = session.createRequest('Diameter Common Messages', 'Capabilities-Exchange');
	request.body = request.body.concat([ 
		[ 'Origin-Host', 'gx.pcef.com' ],
		[ 'Origin-Realm', 'pcef.com' ],
		[ 'Vendor-Id', 10415 ],
		[ 'Origin-State-Id', 219081 ],
		[ 'Supported-Vendor-Id', 10415 ],
		[ 'Auth-Application-Id', 'Diameter Credit Control' ] 
	]);
	console.log('REQUEST:');
	console.log(diameter.messageToColoredString(request));
	session.sendRequest(request).then(function(response) {
		console.log('RESPONSE:');
		console.log(diameter.messageToColoredString(response));
		
		session.end();
	}, function(error) {
		console.log('Error sending request: ' + error);
	});
}, function(error) {
	console.log('Unable to create session: ' + error);
}).done();
