var path = require('path');
var fs = require('fs');

function JsonDB(file) {
    this.file = path.resolve(file);

    try {
        this.data = (require(this.file));
    } catch (e) {
        this.data = [];
    }
}

JsonDB.prototype.all = function (callback) {
    callback(this.data);
};

JsonDB.prototype.get = function (key, val, callback) {
    var found = [];

    this.data.forEach( function (ele) {
        if (ele[key]) {
            if (val && ele[key] === val) {
                found.push(ele);
            } else if (!val) {
                found.push(ele);
            }
        }
    });

    callback(found);
};

JsonDB.prototype.add = function (obj, callback) {
    obj.created_at = obj.created_at || Date.now();
    this.data.push(obj);
    fs.writeFile(this.file, JSON.stringify(this.data), function (err) {
        if (err) {
            console.error('Error saving to %s!',this.file);
            console.trace(err);
            fs.writeFile('/tmp/jsondb-save.json', JSON.stringify(this.data), function (err) {
                if (!err) {
                    console.error('-> Saved backup data at: /tmp/jsondb-save.json');
                }
                process.exit(1);
            });
        }
        if (typeof callback === 'function') {
            callback(obj);
        }
    });
};

module.exports = JsonDB;
