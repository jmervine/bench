var MongoClient = require('mongodb').MongoClient;
var DB = require('../lib/db');

var DATABASE = "mongodb://localhost/bench_test";
var COLLECTION = "test";

function resetTestDB(cb) {
    dropDatabase();
    MongoClient.connect(DATABASE, function(err, db) {
        if(err) {
            console.trace(err);
            throw err;
        }
        var col = db.collection(COLLECTION);

        col.insert({ foo: "FOO", bar: "BAR" }, function( err, docs ) {
            col.insert({ foo: "NOTFOO", bar: "NOTBAR" }, function( err, docs ) {
                db.close();
                cb();
            });
        });
    });
}

function dropDatabase() {
    MongoClient.connect(DATABASE, function(err, db) {
        if(err) {
            console.trace(err);
            throw err;
        }
        db.dropDatabase(function (err, done) {
            db.close();
        });
    });
}

module.exports = {
    setUp: function (cb) {
        resetTestDB(function () {
            cb();
        });
    },
    tearDown: function (cb) {
        cb();
    },

    init: function (test) {
        var db;
        test.expect(1);
        test.ok(new DB(DATABASE, COLLECTION));
        test.done();
    },

    all: function (test) {
        var db;
        test.expect(1);
        db = new DB(DATABASE, COLLECTION);

        db.all(function (found) {
            test.equal(2, found.length);
            test.done();
        });
    },

    getKey: function (test) {
        var db;
        test.expect(1);
        db = new DB(DATABASE, COLLECTION);

        db.get('foo', null, function(found) {
            test.equal(2, found.length);
            test.done();
        });
    },

    getVal: function (test) {
        var db;
        test.expect(1);
        db = new DB(DATABASE, COLLECTION);

        db.get('foo', 'FOO', function(found) {
            test.equal(1, found.length);
            test.done();
        });
    },

    add: function (test) {
        var db;
        test.expect(3);
        db = new DB(DATABASE, COLLECTION);

        db.add({ foo: "NEWFOO", bar: "NEWBAR" }, function(obj) {
            test.ok(obj);
            db.all(function (found) {
                test.equal(3, found.length);
                test.equal("NEWFOO", found[2].foo);
                test.done();
            });
        });
    }

};
