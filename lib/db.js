var MongoClient = require('mongodb').MongoClient;

function DB(connStr, collection, navite_parser) {
    this.navite_parser = navite_parser || false;
    this.connectionString = connStr;
    this.collection = collection;
}

// db.all(cb)
DB.prototype.all = function (callback) {
    var collection = this.collection;
    MongoClient.connect(this.connectionString, {db: {native_parser: this.navite_parser}}, function(err, db) {
        if (err) {
            console.trace(err);
            process.exit(1);
        }
        db.collection(collection).find().toArray(function (err, res) {
            if (err) { console.warn(err.message); }
            callback(res);
            db.close();
        });
    });
};

// db.get(key, val, cb)
DB.prototype.get = function (key, val, callback) {
    var collection = this.collection;
    MongoClient.connect(this.connectionString, {db: {native_parser: this.navite_parser}}, function(err, db) {
        if (err) {
            console.trace(err);
            db.close();
            process.exit(1);
        }

        if (!val) {
            db.collection(collection).find().toArray(function (err, res) {
                if (err) { console.warn(err.message); }
                db.close();
                var ret = [];
                res.forEach(function(ele) {
                    if (ele[key]) {
                        ret.push(ele);
                    }
                });
                callback(res);
            });
        } else {
            var obj = {};
            obj[key] = val;
            db.collection(collection).find(obj).toArray(function (err, res) {
                if (err) { console.warn(err.message); }
                callback(res);
            });
        }
        db.close();
    });
};

// db.add(obj, cb)
DB.prototype.add = function (obj, callback) {
    if (!obj.created_at) {
        obj.created_at = Date.now();
    }
    var collection = this.collection;
    MongoClient.connect(this.connectionString, {db: {native_parser: this.navite_parser}}, function(err, db) {
        if (err) {
            console.trace(err);
            db.close();
            process.exit(1);
        }
        db.collection(collection).insert(obj, {w:1}, function (err, objects) {
            if (err) { console.warn(err.message); }
            if (typeof callback === 'function') {
                callback(objects);
            } else {
                return (!err);
            }
            db.close();
            callback();
        });
    });
};

module.exports = DB;
