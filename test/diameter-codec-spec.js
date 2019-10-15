var codec = require('../lib/diameter-codec');

describe('diameter-codec', function() {

    describe('encodeAvp', function() {

        it('encodes string key and string value', function() {
            var avp = ['Result-Code', 'DIAMETER_SUCCESS'];
            expect(codec.encodeAvp(avp).toString('hex')).toBe('0000010c4000000c000007d1');
        });

        it('encodes numeric key and string value', function() {
            var avp = [268, 'DIAMETER_SUCCESS'];
            expect(codec.encodeAvp(avp).toString('hex')).toBe('0000010c4000000c000007d1');
        });

        it('encodes numeric key and numeric value', function() {
            var avp = [268, 2001];
            expect(codec.encodeAvp(avp).toString('hex')).toBe('0000010c4000000c000007d1');
        });

        it('encodes string key and string value that is an application ID name', function() {
            var avp = ['Auth-Application-Id', 'Diameter Credit Control Application'];
            expect(codec.encodeAvp(avp).toString('hex')).toBe('000001024000000c00000004');
        });

        it('encodes string key and string value that is an application ID code', function() {
            var avp = ['Auth-Application-Id', 4];
            expect(codec.encodeAvp(avp).toString('hex')).toBe('000001024000000c00000004');
        });
    });
    describe('decodeAvp', function() {

        it('decodes application ID code as a string', function() {
            var buffer = new Buffer('000001024000000c00000004', 'hex');
            var decoded = codec.decodeAvp(buffer, 0);
            expect(decoded.code).toBe('Auth-Application-Id');
            expect(decoded.data).toBe('Diameter Credit Control Application');
        });

        it('decodes non mandartory avp ', function() {
            var buffer = new Buffer('000009a4800000100000014300000080', 'hex');
            var decoded = codec.decodeAvp(buffer, 0);
            expect(decoded.code).toBe('DSR-ApplicationInvoked');
            expect(decoded.data).toBe(128);
        });

        it('decodes non mandartory avp ', function() {
            var buffer = new Buffer('000001154000000c000000ff', 'hex');
            expect(() => { codec.decodeAvp(buffer, 0) }).toThrow(new Error('No enum value found for Auth-Session-State code 255'));
        });
    });
});
