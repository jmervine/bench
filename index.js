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

var failed_test = false;

/***********************************************************************
 * Helpers
 **********************************************************************/
function write() {
    console.log('\nWriting results to: %s', storage);
    fs.writeFileSync(storage, 'var thresholds = '
                     + JSON.stringify(settings.thresholds, null, 4)
                     + '\n\n'
                     + 'var results = '
                     + JSON.stringify(results, null, 4)
                     + '\n\nif (typeof window === \'undefined\') { '
                     + 'module.exports = { results: results, thresholds: thresholds}; }');
}

function verify() {
    if (tested_keys.length !== Object.keys(settings.thresholds).length) {
        console.error('ERROR: Not all tests were run.');
        console.error('Tested:\n' + JSON.stringify(tested_keys, null, 4));
        console.error('\nExpected:\n' + JSON.stringify(Object.keys(settings.thresholds), null, 4));
        process.exit(1);
    }

    if (failed_test) {
        process.exit(1);
    }

    process.exit(0);
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

/***********************************************************************
 * Benchmarks
 **********************************************************************/
var httpURI    = '\''+getUrl(settings.host, settings.path)+'\'';

var results;
try {
    results = require(storage).results;
} catch(e) {
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
    return function (callback) {
        debug('Running server: ' + httpURI);
        try {
            benchObj.run( function (run, etc) {

                if (typeof etc === 'object') {
                    if (etc.error) { callback(etc.error); }
                }

                if (name === 'client') { run = run.metrics; }
                results[rindex][name] = run;
                Object.keys(settings.thresholds).forEach( function (key) {
                    debug('checking ' + key);
                    var stat = '+';
                    if (run.hasOwnProperty(key)) {
                        tested_keys.push(key);
                        if (key === 'o') {
                            debug('omg \'o\'');
                            if (run[key] <= settings.thresholds[key]) {
                                stat = '-';
                                failed_test = true;
                            }
                        } else {
                            if (run[key] >= settings.thresholds[key]) {
                                stat = '-';
                                failed_test = true;
                            }
                        }
                        console.log('[%s] %s\n    -> %s (threshold: %s)\n',
                                    stat, key, run[key], settings.thresholds[key]);
                    }
                });
                callback();
            });
        } catch (e) {
            callback(e);
        }
    };
}

var benchmarks = { };

console.log('\nChecking: %s', httpURI);
console.log('------------------------------------------------------------');
benchmarks['server: '+httpURI] = bench('server', server());
benchmarks['client: '+httpURI] = bench('client', client());
benchmarks['grader: '+httpURI] = bench('grader', grader());

Object.keys(benchmarks).forEach(function (bm) {
    benchmarks[bm](function (error) {
        if (error) { throw error; }
    });
});

/***********************************************************************
 * Finish up
 **********************************************************************/
process.on('exit', function () {
    write();
    verify();
});

