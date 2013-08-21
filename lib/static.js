var
    fs  = require('fs'),
    DB  = require('./db'),
    JDB = require('./jsondb'),
    staticFile = './database.js',
    db;

module.exports = function static(cli, callback) {
    if (cli.database.indexOf('mongodb://') === 0) {
        db = new DB(cli.database, cli.collection);
    } else {
        db = new JDB(cli.database);
    }

    db.all( function (result) {
        var start = "var result = ";
        var end = ";";
        fs.writeFile(staticFile, start+JSON.stringify(result,null,2)+end, function (err) {
            if (err) {
                console.trace(err);
            } else {
                console.log('static out: %s', staticFile);
            }
            callback();
        });
    });
};
