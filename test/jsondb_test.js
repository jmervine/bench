var JsonDB = require('../lib/jsondb');
var fs = require('fs');

function resetTestDB() {
    fs.writeFileSync('./test/test_jsondb.json', JSON.stringify([
        { foo: "FOO", bar: "BAR" },
        { foo: "NOTFOO", bar: "NOTBAR" }
    ]));
}

module.exports = {
    setUp: function(cb) {
        resetTestDB();
        cb();
    },
    tearDown: function(cb) {
        resetTestDB();
        cb();
    },
    init: function (test) {
        var jsondb;
        test.expect(2);
        test.ok(new JsonDB('./foo.json'));

        jsondb = new JsonDB('./foo.json');
        test.deepEqual([], jsondb.data);
        test.done();
    },
    all: function (test) {
        var jsondb;
        test.expect(1);
        jsondb = new JsonDB('./test/test_jsondb.json');

        jsondb.all(function(found) {
            test.equal(2, found.length);
            test.done();
        });
    },
    getKey: function (test) {
        var jsondb;
        test.expect(1);
        jsondb = new JsonDB('./test/test_jsondb.json');

        jsondb.get('foo', null, function(found) {
            test.equal(2, found.length);
            test.done();
        });

    },
    getVal: function (test) {
        var jsondb;
        test.expect(1);
        jsondb = new JsonDB('./test/test_jsondb.json');

        jsondb.get('foo', 'FOO', function(found) {
            test.equal(1, found.length);
            test.done();
        });
    },
    add: function (test) {
        var jsondb;
        test.expect(3);
        jsondb = new JsonDB('./test/test_jsondb.json');

        jsondb.add({ foo: "NEWFOO", bar: "NEWBAR" }, function(obj) {
            test.ok(obj);
            jsondb.all(function (found) {
                test.equal(3, found.length);
                test.equal("NEWFOO", found[2].foo);
                test.done();
            });
        });
    }
};
