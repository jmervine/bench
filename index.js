/***********************************************************************
 * Libs
 **********************************************************************/
var fs          = require('fs');
var path        = require('path');
var assert      = require('assert');
var HTTPerf     = require('httperfjs');
var Phapper     = require('phapper');
var YSlow       = require('yslowjs');
var settings    = require('./config.json');

var storage     = './latest.js';

/***********************************************************************
 * Helpers
 **********************************************************************/
function write() {
    console.log('Writing results to: %s', storage);
    fs.writeFileSync(storage, 'var thresholds = '
                     + JSON.stringify(settings.thresholds, null, 4)
                     + '\n\n'
                     + 'var results = '
                     + JSON.stringify(results, null, 4)
                     + '\n\nif (typeof window === \'undefined\') { '
                     + 'module.exports = { results: results, thresholds: thresholds}; }');
}

function report() {
    console.log('\nResults:');
    Object.keys(settings.thresholds).forEach(function(key) {
        [ 'server', 'client', 'grader' ].forEach(function(marker) {
            if (results[rindex][marker].hasOwnProperty(key)) {
                console.log('- %s: %s', key, results[rindex][marker][key]);
            }
        });
    });
}

function verify_total() {
    if (tested_keys.length !== Object.keys(settings.thresholds).length) {
        console.error('ERROR: Not all tests were run.');
        console.error('Tested:\n' + JSON.stringify(tested_keys, null, 4));
        console.error('\nExpected:\n' + JSON.stringify(Object.keys(settings.thresholds), null, 4));
        process.exit(1);
    } else {
        process.exit();
    }
}

function debug(message) {
    if (process.env.DEBUG || settings.DEBUG === true) {
        console.log('[DEBUG]: ' + message);
    }
}

function getUrl(hostname, uri) {
    return 'http://'+path.join(hostname, uri);
}

function server() {
    return new HTTPerf({
        server:      settings.host,
        verbose:     true,
        uri:         settings.path,
        'num-conns': settings.runs
    });
}

function client() {
    return new Phapper(
        './phantomas.js',
        ['--format=json', '--url='+getUrl(settings.host, settings.path)],
        { cwd: './lib/phantomas' }
    );
}

function grader() {
    return new YSlow(getUrl(settings.host, settings.path),
                     [ '--info', 'basic' ]);
}

function benchFactory(mark) {
    var name = '\''+getUrl(settings.host, settings.path)+'\'';
    debug('Building ' + name);
    benchmarks[name] = function (test) {
        debug('Running ' + name);
        mark.run( function (run) {
        });
    };
}

/***********************************************************************
 * Benchmarks
 **********************************************************************/
var httpURI    = '\''+getUrl(settings.host, settings.path)+'\'';

var results;
try {
    results = require(storage).results;
} catch(e) {
    console.log(e);
    results = [];
}
var rindex = results.length;

if (rindex === 10) {
    results.shift();
    rindex--;
}
results.push({});

var tested_keys = [];

function bench(name, benchObj) {
    debug('Building ' + name);
    return function (test) {
        var expect = 1;
        debug('Running server: ' + httpURI);
        benchObj.run( function (run) {
            if (name === 'client') { run = run.metrics; }
            debug(name + ' callback.');
            debug(run);
            debug(results[rindex]);
            results[rindex][name] = run;
            test.ok(run);
            Object.keys(settings.thresholds).forEach( function (key) {
                debug('checking ' + key);
                if (run.hasOwnProperty(key)) {
                    expect++;
                    tested_keys.push(key);
                    if (key === 'o') {
                        test.ok(run[key] >= settings.thresholds[key],
                           '\''+key+'\' threshold: '+settings.thresholds[key]+' / actual: '+run[key]);
                    } else {
                        test.ok(run[key] <= settings.thresholds[key],
                           '\''+key+'\' threshold: '+settings.thresholds[key]+' / actual: '+run[key]);
                    }
                }
            });
            test.expect(expect);
            test.done();
        });
    };
}

var benchmarks = {
    setUp:    function (cb) { cb(); },
    tearDown: function (cb) { cb(); },
};

benchmarks['server: '+httpURI] = bench('server', server());
benchmarks['client: '+httpURI] = bench('client', client());
benchmarks['grader: '+httpURI] = bench('grader', grader());

module.exports = benchmarks;

/***********************************************************************
 * Finish up
 **********************************************************************/
process.on('exit', function () {
    write();
    report();
    verify_total();
});

