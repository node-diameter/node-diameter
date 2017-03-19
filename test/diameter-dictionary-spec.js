var dictionary = require('../lib/diameter-dictionary');
var _ = require('lodash');

describe('diameter-dictionary', function () {

    it('getAvpByCode', function () {
        var avp = dictionary.getAvpByCode(1);
        expect(avp).toEqual({
            code: 1,
            name: 'Ping-Timestamp-Secs',
            vendorId: 42,
            type: 'Unsigned32',
            flags: {
                mandatory: false,
                protected: false,
                mayEncrypt: false,
                vendorBit: true
            }
        });
    });

    it('getAvpByName', function () {
        var avp = dictionary.getAvpByName('Ping-Timestamp-Secs');
        expect(avp).toEqual({
            code: 1,
            name: 'Ping-Timestamp-Secs',
            vendorId: 42,
            type: 'Unsigned32',
            flags: {
                mandatory: false,
                protected: false,
                mayEncrypt: false,
                vendorBit: true
            }
        });
    });

    it('getApplicationById', function () {
        var avp = dictionary.getApplicationById(0);
        expect(avp).toEqual({ code : 0, name : 'Diameter Common Messages' });
    });

    it('getApplicationByName', function () {
        var avp = dictionary.getApplicationByName('Diameter Common Messages');
        expect(avp).toEqual({ code : 0, name : 'Diameter Common Messages' });
    });

    it('getCommandByCode', function () {
        var avp = dictionary.getCommandByCode(100);
        expect(avp).toEqual({ code : 100, name : 'Peer Information', vendorId : 11 });
    });

    it('getCommandByName', function () {
        var avp = dictionary.getCommandByName('Peer Information');
        expect(avp).toEqual({ code : 100, name : 'Peer Information', vendorId : 11 });
    });

    it('getAvpByCodeAndVendorId', function () {
        var avp = dictionary.getAvpByCodeAndVendorId(6, 10415);
        expect(avp).toEqual({
            code: 6,
            name: '3GPP-SGSN-Address',
            vendorId: 10415,
            type: 'IPAddress',
            flags: {
                mandatory: true,
                protected: true,
                mayEncrypt: true,
                vendorBit: true
            }
        });
    });
});
