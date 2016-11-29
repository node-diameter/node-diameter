var util = require('../lib/diameter-util');

describe('diameter-util', function() {

    it('generates random number', function() {
        expect(util.random32BitNumber()).toBeGreaterThan(0);
    });
});
