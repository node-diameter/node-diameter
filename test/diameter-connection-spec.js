var DiameterConnection = require('../lib/diameter-connection').DiameterConnection;
var codec = require('../lib/diameter-codec');


describe('diameter-connection', function () {

    it('handles traffic', function (done) {
        var mockClientSocket = createMockSocket();
        var mockServerSocket = createMockSocket();
        
        mockServerSocket.on('diameterMessage', function(event) {
            if (event.message.command === 'Capabilities-Exchange') {
                event.response.body = event.response.body.concat(createCEA());
                event.callback(event.response);
            }
        });

        var clientConnection = new DiameterConnection({}, mockClientSocket);
        var serverConnection = new DiameterConnection({}, mockServerSocket);
        
        var request = createCER(clientConnection);
        var responsePromise = clientConnection.sendRequest(request);

        mockServerSocket.eventHandlers['data'](mockClientSocket.buffer);
        setImmediate(function() {
            mockClientSocket.eventHandlers['data'](mockServerSocket.buffer);
            done();
        });
    });

    it('multiple requests in same buffer', function (done) {
        var mockClientSocket = createMockSocket();
        var mockServerSocket = createMockSocket();
        
        mockServerSocket.on('diameterMessage', function(event) {
            if (event.message.command === 'Capabilities-Exchange') {
                event.response.body = event.response.body.concat(createCEA());
                event.callback(event.response);
            }
        });

        var clientConnection = new DiameterConnection({}, mockClientSocket);
        var serverConnection = new DiameterConnection({}, mockServerSocket);
        
        for (var i = 0; i < 5; i++) {
            var request = createCER(clientConnection);
            var responsePromise = clientConnection.sendRequest(request);
        }

        mockServerSocket.eventHandlers['data'](mockClientSocket.buffer);
        setImmediate(function() {
            mockClientSocket.eventHandlers['data'](mockServerSocket.buffer);
            done();
        });
    });

    it('connection receiving data in chunks', function (done) {
        var mockClientSocket = createMockSocket();
        var mockServerSocket = createMockSocket();
        
        mockServerSocket.on('diameterMessage', function(event) {
            if (event.message.command === 'Capabilities-Exchange') {
                event.response.body = event.response.body.concat(createCEA());
                event.callback(event.response);
            }
        });

        var clientConnection = new DiameterConnection({}, mockClientSocket);
        var serverConnection = new DiameterConnection({}, mockServerSocket);
        
        for (var i = 0; i < 5; i++) {
            var request = createCER(clientConnection);
            var responsePromise = clientConnection.sendRequest(request);
        }

        mockServerSocket.eventHandlers['data'](mockClientSocket.buffer);
        setImmediate(function() {
            for (var j = 0; j < mockServerSocket.buffer.length; j++) {
                var chunk = mockServerSocket.buffer.slice(j, j + 1);
                mockClientSocket.eventHandlers['data'](chunk);
            }
            done();
        });
    });

    var createCER = function(connection) {
        var request = connection.createRequest('Diameter Common Messages', 'Capabilities-Exchange');
        request.body = request.body.concat([
            [ 'Origin-Host', 'gx.pcef.example.com' ],
            [ 'Origin-Realm', 'pcef.example.com' ],
            [ 'Vendor-Id', 10415 ],
            [ 'Origin-State-Id', 219081 ],
            [ 'Supported-Vendor-Id', 10415 ],
            [ 'Auth-Application-Id', 'Diameter Credit Control Application' ]
        ]);
        return request;
    };

    var createCEA = function() {
        return [
            ['Result-Code', 'DIAMETER_SUCCESS'],
            ['Origin-Host', 'test.com'],
            ['Origin-Realm', 'com'],
            ['Host-IP-Address', '2001:db8:3312::1'],
            ['Host-IP-Address', '1.2.3.4'],
            ['Vendor-Id', 123],
            ['Product-Name', 'node-diameter']
        ];
    };

    var createMockSocket = function() {
        return mockSocket = {
            eventHandlers: {},
            buffer: new Buffer(0),
            on: function(eventName, eventHandler) {
                this.eventHandlers[eventName] = eventHandler;
            },
            emit: function(eventName, data) {
                var handler = this.eventHandlers[eventName];
                if (handler !== undefined) handler(data);
            },
            write: function(data) {
                this.buffer = Buffer.concat([this.buffer, data instanceof Buffer ? data : new Buffer(data)]);
            }
        };
    };

});
