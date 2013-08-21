#! /usr/bin/env node
var
    Bench  = require('./lib/bench'),
    DB     = require('./lib/db'),
    JDB    = require('./lib/jsondb'),
    cli    = require('./lib/cli'),
    static = require('./lib/static');

var bench = new Bench(cli.url);
var runs  = [];
var db;

if (cli.static) {
    static(cli, function () {
        console.log('static generation successful');
        process.exit(0);
    });
} else {

    if (cli.database.indexOf('mongodb://') === 0) {
        db = new DB(cli.database, cli.collection);
    } else {
        db = new JDB(cli.database);
    }

    function handleRun(result) {
        if (!result.json) {
            console.log(result.raw);
        } else {
            runs.push(result.json);
        }

        console.log("Run %s complete.", runs.length);
        if (runs.length === cli.runs) {
            var set = median(runs);
            db.add(set);
        }
    }

    function median(values) {
        values.sort(function(a,b) {return (a.last_nom > b.last_nom) ? 1 : ((b.last_nom > a.last_nom) ? -1 : 0);} );
        var half = Math.floor(values.length/2);
        if (values.length % 2) {
            return values[half];
        } else {
            return (values[half-1] + values[half]) / 2.0;
        }
    }

    var i;
    for (i = 0; i < cli.runs; i++) {
        bench.run(handleRun);
    }
}
