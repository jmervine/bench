#! /usr/bin/env node
var
    spawn  = require('child_process').spawn,
    Bench  = require('./lib/bench'),
    DB     = require('./lib/db'),
    cli    = require('./lib/cli');

var bench = new Bench(cli.url);
var runs  = [];
var db;

switch (cli.action) {
    case 'server':
        [
            'database',
            'collection',
            'runs',
        ].forEach(function(arg) {
            if (typeof process.env[arg] === 'undefined') {
                process.env[arg] = cli[arg];
            }
        });
        spawn('node', ['./server/app.js'], { stdio: 'inherit', env: process.env });
        break;
    default:
        db = new DB(cli.database, cli.collection);

        function handleRun(result) {
            if (!result.json) {
                console.log(result.raw);
                console.log("Run %s complete. (Parse Error Occured!)", runs.length);
            } else {
                runs.push(result.json);
                console.log("Run %s complete. (httpTrafficCompleted: %sms)", runs.length, result.json.metrics.httpTrafficCompleted);
            }

            if (runs.length === cli.runs) {
                var set = median(runs);
                db.add(set, function() {
                    console.log("-------------------------------------------");
                    console.log("Complete! (median httpTrafficCompleted: %sms)", set.metrics.httpTrafficCompleted);
                    process.exit(0);
                });
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
