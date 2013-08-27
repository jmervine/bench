var isError     = require('util').isError;
var MongoClient = require('mongodb').MongoClient;

function dbc(collection, index, callback) {
    MongoClient.connect(process.env.database, {db: {native_parser: true}}, function(err, db) {
        if (err) {
            console.trace(err);
            callback(err);
            db.close();
        } else {
            var col = db.collection(collection);
            col.ensureIndex(index, function(err) {
                if (err) { console.trace(err); } // non-fatal
                callback(db,col);
            });
        }
    });
}

function find(col, qual, rows, opts, callback) {
    col
    .find(qual, rows, opts)
    .toArray(function(err, result) {
        if (err) {
            console.trace(err);
            callback(err);
        } else {
            callback(result);
        }
    });
}

module.exports = {
    index: function(req, res){
      res.render('index', { title: 'Bench' });
    },
    keys: function(req, res) {
        var keys = [];
        dbc(req.params.collection, { metrics: 1 }, function (db, col) {
            if (isError(col)) { res.send(500); return; }
            find(col, {}, { metrics: true }, {}, function (result) {
                if (isError(result)) {
                    res.send(404);
                    db.close();
                    return;
                }
                result.forEach(function(item) {
                    Object.keys(item.metrics).forEach(function(key) {
                        if (keys.indexOf(key) === -1) {
                            keys.push(key);
                        }
                    });
                });
                db.close();
                res.json(keys);
            });
        });
    },
    urls: function(req, res) {
        dbc(req.params.collection, { url: 1 }, function (db, col) {
            if (isError(col)) { res.send(500); return; }
            find(col, {}, { url: true }, { sort: 'url' }, function (result) {
                if (isError(result)) {
                    res.send(404);
                    db.close();
                    return;
                }
                var found = [];
                result.forEach(function(item) {
                    if (found.indexOf(item.url) === -1) {
                        found.push(item.url);
                    }
                });
                db.close();
                res.json(found);
            });
        });
    },
    count: function (req, res) {
        dbc(req.params.collection, { url: 1 }, function (db, col) {
            if (isError(col)) { res.send(500); return; }
            var qual = {};
            if (req.query.url) { qual.url = req.query.url; }
            col.find(qual).count(function(err, count) {
                if (err) {
                    console.trace(err);
                    res.send(404);
                } else {
                    res.json(count);
                }
                db.close();
            });
        });
    },
    data: function(req, res){
        var limit   = parseInt(req.query.limit, 10) || 10;
        var start   = parseInt(req.query.start, 10) || false;

        if (!start && req.query.start && req.query.start === '0') {
            start = 0;
        }

        dbc(req.params.collection, { created_at: 1, url: 1 }, function (db, col) {
            if (isError(col)) { res.send(500); return; }
            var opts = { sort: 'created_at' };
            var rows = { url: true, metrics: true, created_at: true };
            var qual = {};
            if (req.query.url) {
                qual.url = req.query.url;
            }
            find(col, qual, rows, opts, function (result) {
                if (isError(result)) {
                    res.send(404);
                    db.close();
                    return;
                }
                var set;
                if (start || start === 0) {
                    set = result.slice(start, start+limit);
                } else {
                    set = result.slice(result.length-limit);
                }
                db.close();
                res.json(set);
            });
        });
    }
};
