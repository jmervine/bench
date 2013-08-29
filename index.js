#! /usr/bin/env node
var
    MongoClient = require('mongodb').MongoClient,
    spawn  = require('child_process').spawn,
    Bench  = require('./lib/bench'),
    path   = require('path'),
    async  = require('async'),
    cli    = require('./lib/cli');

var bench = new Bench(cli.url);
var runs  = [];
var db;

function median(values) {
    values.sort(function(a,b) {return (a.last_nom > b.last_nom) ? 1 : ((b.last_nom > a.last_nom) ? -1 : 0);} );
    var half = Math.floor(values.length/2);
    if (values.length % 2) {
        return values[half];
    }
    return (values[half-1] + values[half]) / 2.0;
}

function seriesAction(callback) {
    console.log('Running %s...', runcount++);
    bench.run(function (result) {
        if (!result.json) {
            console.log(result.raw);
            console.log("Run %s complete. (Parse Error Occured!)", runs.length);
        } else {
            runs.push(result.json);
            console.log("Run %s complete. (httpTrafficCompleted: %sms)", runs.length, result.json.metrics.httpTrafficCompleted);
        }
        callback(null, null);
    });
}


switch (cli.action) {
    case 'server':
        [ 'database',
          'collection',
          'ui_title_text',
          'ui_title_link',
          'runs'
        ].forEach(function(arg) {
            if (typeof process.env[arg] === 'undefined' && typeof cli[arg] !== 'undefined') {
                process.env[arg] = cli[arg];
            }
        });
        spawn('node', [path.resolve(__dirname,'./server/app.js')], { stdio: 'inherit', env: process.env });
        break;
    default:
        var series = [];
        var runcount = 1;
        for (i = 0; i < cli.runs; i++) {
            series.push(seriesAction);
        }

        async.series(series, function (err, result) {
            var set = median(runs);
            set.created_at = Date.now();
            MongoClient.connect(cli.database, {db: {native_parser: true}}, function(err, db) {
                if (err) {
                    console.trace(err);
                    process.exit(1);
                }
                var collection = db.collection(cli.collection);
                collection.insert(set, function (err, obj) {
                    console.log("-------------------------------------------");
                    console.log("Complete! (median httpTrafficCompleted: %sms)", set.metrics.httpTrafficCompleted);
                    console.log("-------------------------------------------");
                    if (err) { console.trace(err); }
                    if (!obj) { console.log('Error inserting set:\n%s', JSON.stringify(set, null, 2)); }

                    if (err || !obj) {
                        console.log("-------------------------------------------");
                    }

                    console.log('MongoDB Database:\n - %s', cli.database);
                    console.log('MongoDB Collection:\n - %s', cli.collection);
                    console.log("-------------------------------------------");
                    process.exit(0);
                });
            });
        });
}
