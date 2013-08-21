var Bench = require('../lib/bench');
var Phapper = require('phapper'); // stub it

// stub Phapper run results
Phapper.prototype.run = function (callback) {
    callback(require('./phantomas_stub.json'), {});
};

exports.benchTest = function (test) {
    test.expect(4);
    test.ok(new Bench());
    var bench = new Bench('http://example.com');
    test.ok(bench.phantomas.args[1].indexOf('example.com') !== -1);
    bench.run( function (r) {
        test.ok(r.json);
        test.ok(r.raw);
        test.done();
    });
};
