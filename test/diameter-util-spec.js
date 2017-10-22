var util = require('../lib/diameter-util');
var _ = require('lodash');

describe('diameter-util', function() {

    it('generates random number', function() {
        expect(util.random32BitNumber()).toBeGreaterThan(0);
    });

    it('gets AVP value from a diameter message', function() {
        this.addMatchers({
            toDeepEqual: function(expected) {
                return _.isEqual(this.actual, expected);
            }
        });
        
        var exampleMessage = [
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
                ]],
                ['Requested-Service-Unit', [
                    ['CC-Time', 124],
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
        ];

        expect(util.getAvpValue(exampleMessage, '....')).toBe(undefined);
        expect(util.getAvpValue(exampleMessage, 'Origin-Realm')).toBe('com');
        expect(function() {
            util.getAvpValue(exampleMessage, 'Origin-Realm[1]');
        })
        .toThrow(new Error('Can\'t resolve path, index for \'Origin-Realm\' is out of bounds'));
        expect(util.getAvpValue(exampleMessage, 'Not-Present')).toBe(undefined);
        expect(util.getAvpValue(exampleMessage, 'Result-Code')).toBe(2001);
        expect(util.getAvpValue(exampleMessage, 
            'Multiple-Services-Credit-Control.Granted-Service-Unit.CC-Time'))
            .toBe(123);
        expect(util.getAvpValue(exampleMessage, 
            'Multiple-Services-Credit-Control.Granted-Service-Unit.Missing'))
            .toBe(undefined);
        expect(util.getAvpValue(exampleMessage, 
            'Multiple-Services-Credit-Control.Requested-Service-Unit[1].CC-Time'))
            .toBe(124);
        expect(function() {
                util.getAvpValue(exampleMessage, 
                'Multiple-Services-Credit-Control.Requested-Service-Unit.CC-Time');
            })
            .toThrow(new Error('Can\'t resolve path, multiple AVPs found with name \'Requested-Service-Unit\''));
        expect(util.getAvpValue(exampleMessage, 
            'Multiple-Services-Credit-Control.Requested-Service-Unit[1]'))
            .toDeepEqual([
                ['CC-Time', 124],
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
            ]);
    });
});
