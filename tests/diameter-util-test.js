jest.autoMockOff();
jest.dontMock('../lib/diameter-util');

describe('diameter-util', function() {
    it('generates random number', function() {
        var util = require('../lib/diameter-util');
        expect(util.random32BitNumber()).toBeGreaterThan(0);
    });
});