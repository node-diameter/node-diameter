var Buffer = require('buffer').Buffer;
var types = require('../lib/diameter-types');
var _ = require('lodash');

describe('diameter-types', function() {
    
    it('handles common types', function() {
        var parsableTypes = types.getParsableTypes();
        _.each(['OctetString',
            'Unsigned32',
            'Integer32',
            'Unsigned64',
            'Integer64',
            'Time',
            'IPAddress'], function(type) {
                expect(_.includes(parsableTypes, type)).toBe(true);
            });
    });
    
    it('throws on unknown type', function() {
        expect(types.encode.bind(null, 'UnknownType', 'test')).toThrow('No handler for type: UnknownType');
        expect(types.decode.bind(null, 'UnknownType', new Buffer('test'))).toThrow('No handler for type: UnknownType');
    });
    
    it('encodes OctetString', function() {
        expect(types.encode('OctetString', 'test').toString('utf8')).toBe('test');
    });
    
    it('decodes OctetString', function() {
        expect(types.decode('OctetString', new Buffer('test', 'utf8'))).toBe('test');
    });
    
    it('encodes Unsigned32', function() {
        expect(types.encode('Unsigned32', 123).toString('hex')).toBe('0000007b');
    });
    
    it('decodes Unsigned32', function() {
        expect(types.decode('Unsigned32', new Buffer('0000007b', 'hex'))).toBe(123);
    });
    
    it('encodes Integer32', function() {
        expect(types.encode('Integer32', 123).toString('hex')).toBe('0000007b');
    });
    
    it('decodes Integer32', function() {
        expect(types.decode('Integer32', new Buffer('0000007b', 'hex'))).toBe(123);
    });
    
    it('encodes IPAddress', function() {
        expect(types.encode('IPAddress', '1.2.3.4').toString('hex')).toBe('000101020304');
        expect(types.encode('IPAddress', '2001:0db8:0000:0000:0000:ff00:0042:8329').toString('hex'))
            .toBe('000220010db8000000000000ff0000428329');
        expect(types.encode('IPAddress', '2001:db8:0:0:0:ff00:42:8329').toString('hex'))
            .toBe('000220010db8000000000000ff0000428329');
        expect(types.encode('IPAddress', '2001:db8::ff00:42:8329').toString('hex'))
            .toBe('000220010db8000000000000ff0000428329');
    });
    
    it('decodes IPAddress', function() {
        expect(types.decode('IPAddress', new Buffer('000101020304', 'hex'))).toBe('1.2.3.4');
        expect(types.decode('IPAddress', new Buffer('000220010db8000000000000ff0000428329', 'hex')))
            .toBe('2001:db8::ff00:42:8329');
    });
});