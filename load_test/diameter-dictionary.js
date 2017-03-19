var dictionary = require('../lib/diameter-dictionary');

var ITERATIONS = 1000000;

var hrtimeToNanos = function(hrTime) {
    return hrTime[0] * 1000000 + hrTime[1]
}

var testGetAvpByCode = function() {
    var startTime = process.hrtime();
    for (var i = 0; i < ITERATIONS; i++) {
        for (var j = 0; j < 10; j++) {
            dictionary.getAvpByCode(j);
        }
    }
    return hrtimeToNanos(process.hrtime(startTime));
}

var testGetAvpByName = function() {
    var names = [];
    for (var j = 0; j < 10; j++) {
        names.push(dictionary.getAvpByCode(j).name);
    }
    var startTime = process.hrtime();
    for (var i = 0; i < ITERATIONS; i++) {
        names.forEach(name => {
            dictionary.getAvpByName(name);
        });
    }
    return hrtimeToNanos(process.hrtime(startTime));
}

var testGetApplicationById = function() {
    var startTime = process.hrtime();
    for (var i = 0; i < ITERATIONS; i++) {
        for (var j = 0; j < 8; j++) {
            dictionary.getApplicationById(j);
        }
    }
    return hrtimeToNanos(process.hrtime(startTime));
}

var testGetApplicationByName = function() {
    var names = [];
    for (var j = 0; j < 8; j++) {
        names.push(dictionary.getApplicationById(j).name);
    }
    var startTime = process.hrtime();
    for (var i = 0; i < ITERATIONS; i++) {
        names.forEach(name => {
            dictionary.getApplicationByName(name);
        });
    }
    return hrtimeToNanos(process.hrtime(startTime));
}

var testGetCommandByCode = function() {
    var startTime = process.hrtime();
    for (var i = 0; i < ITERATIONS; i++) {
        for (var j = 100; j < 104; j++) {
            dictionary.getCommandByCode(j);
        }
    }
    return hrtimeToNanos(process.hrtime(startTime));
}

var testGetCommandByName = function() {
    var names = [];
    for (var j = 100; j < 104; j++) {
        names.push(dictionary.getCommandByCode(j).name);
    }
    var startTime = process.hrtime();
    for (var i = 0; i < ITERATIONS; i++) {
        names.forEach(name => {
            dictionary.getCommandByName(name);
        });
    }
    return hrtimeToNanos(process.hrtime(startTime));
}

var testGetAvpByCodeAndVendorId = function() {
    var startTime = process.hrtime();
    for (var i = 0; i < ITERATIONS; i++) {
        dictionary.getAvpByCodeAndVendorId(6, 10415);
    }
    return hrtimeToNanos(process.hrtime(startTime));
}

var result = {
    getAvpByCode: testGetAvpByCode() / ITERATIONS,
    getAvpByName: testGetAvpByName() / ITERATIONS,
    getApplicationById: testGetApplicationById() / ITERATIONS,
    getApplicationByName: testGetApplicationByName() / ITERATIONS,
    getCommandByCode: testGetCommandByCode() / ITERATIONS,
    getCommandByName: testGetCommandByName() / ITERATIONS,
    getAvpByCodeAndVendorId: testGetAvpByCodeAndVendorId() / ITERATIONS
}

console.log('Number of iterations: ' + ITERATIONS);
console.log('Average duration (in nanoseconds) per function: ');
console.log(JSON.stringify(result, null, 4));