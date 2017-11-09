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

        it('encodes string key and string value that is an application name', function() {
            var avp = ['Auth-Application-Id', 'Diameter Credit Control Application'];
            expect(codec.encodeAvp(avp).toString('hex')).toBe('000001024000000c00000004');
        });

        it('encodes string key and string value that is an application code', function() {
            var avp = ['Auth-Application-Id', 4];
            expect(codec.encodeAvp(avp).toString('hex')).toBe('000001024000000c00000004');
        });
    });
});
