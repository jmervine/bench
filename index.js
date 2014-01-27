#! /usr/bin/env node
var spawn    = require('child_process').spawn;
var path     = require('path');
var async    = require('async');
var Bench    = require('./lib/bench');
var cli      = require('./lib/cli');
var db       = require('mongojs')(cli.database, [cli.collection]);
var bench    = new Bench(cli.url);
var runs     = [];
var runcount = 0;
var db;

function median(values) {
    values.sort(function(a,b) { return a.metrics.httpTrafficCompleted - b.metrics.httpTrafficCompleted;} );
    var half = Math.floor(values.length/2);
    if (values.length % 2) {
        return values[half];
    }
    var ret=values[half];
    var other=values[half-1].metrics;
    for(i in ret.metrics ){
        ret.metrics[i]=(ret.metrics[i]+other[i])/2;
    }
    return ret;
}

function seriesAction(callback) {
    process.stdout.write('Running ' + (runcount++) + '... ');
    bench.run(function (result) {
        if (!result.json) {
            console.log(result.raw);
            console.log("complete. (Parse Error Occured!)", runs.length);
        } else {
            runs.push(result.json);
            console.log("complete.\n - httpTrafficCompleted: %sms", result.json.metrics.httpTrafficCompleted);
        }
        callback(null, null);
    });
}

function before() {
    console.log('Benchmarking: %s', cli.url);
    console.log(' ');
}

function after(set) {
    console.log(' ');
    console.log('Done! (median httpTrafficCompleted: %sms)', set.metrics.httpTrafficCompleted);
    console.log(' ');
    console.log('MongoDB Database:\n - %s', cli.database);
    console.log('MongoDB Collection:\n - %s', cli.collection);
    console.log(' ');
}

switch (cli.action) {
    case 'server':
        [ 'database',
          'collection',
          'ui_title_text',
          'ui_title_link',
          'server_theme',
          'chart_theme',
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
        console.log(cli.runs);
        for (i = 0; i < cli.runs; i++) {
            series.push(seriesAction);
        }
        before();
        async.parallelLimit(series,cli.limit, function (err, result) {
            var set = median(runs);
            set.created_at = Date.now();
            if (set) {
                db[cli.collection].save(set, function(err, doc) {
                    if (err) {
                        console.trace(err);
                        db.close();
                        process.exit(1);
                    }
                    after(set);
                    db.close();
                    process.exit(0);
                });
            } else {
                console.log('An error occured, nothing saved.');
                console.log('--------------------------------');
                console.dir(set);
                process.exit(1);
            }
        });
}
