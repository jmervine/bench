#! /usr/bin/env node
/***********************************************************************
 * CLI
 **********************************************************************/
var cli  = require('commander');
var fs   = require('fs');
var ncp  = require('ncp').ncp;
var path = require('path');

cli
  .version('0.0.1')
  .usage('[options] [init or ./config.js]')
  .option('-s , --host [HOST]'   , 'target host')
  .option('-p , --path [PATH]'   , 'target path')
  .option('-r , --runs [RUNS]'   , 'number of runs')
  .option('-o , --output [FILE]' , 'number of runs')
  .option('-w , --warmup'        , 'warmup hosts')
  .option('-d , --debug'         , 'debug messaging');

cli.on('--help', function(){
  console.log('  init: Creates needed files in current working directory.');
  console.log('  - config.json - default configuration.');
  console.log('  - latest.js   - data storage.');
  console.log('  - index.html  - results viewer.');
  console.log('  * WARNING: this will overwrite configs and data.');
  console.log(' ');
  console.log('  Notes:');
  console.log('  - Uses \'./config.js\' by default.');
  console.log('  - Options overide config file settings.');
  console.log(' ');
});

cli.parse(process.argv);

function cpSync(s, d, enc) {
    enc = enc || 'utf8';
    fs.writeFileSync(d, fs.readFileSync(s, enc), enc);
}

function copy(fname, src, dest) {
    var s = path.join(src, fname);
    var d = path.join(dest, fname);
    cpSync(s, d);
    console.log('    Creating: %s', fname);
}

if (cli.args[0] === 'init') {
    console.log(' ');
    console.log('  bench init ');
    console.log(' ');

    var source = path.resolve(__dirname);
    var dest   = path.resolve(process.cwd());
    var latest = path.join(dest, 'latest.js');

    if (source !== dest) {
        copy('config.json', source, dest);
        copy('index.html', source, dest);

        fs.writeFileSync(latest,
            'var thresholds = [];\n\n'
            +'var results = [];\n\n'
            +'if (typeof window === \'undefined\') {'
            +'module.exports = { results: results, thresholds: thresholds}; }');
        console.log('    Creating: latest.js');

        ncp(path.join(source, 'assets'), path.join(dest, 'assets'), function (err) {
            if (err) { console.trace(e); process.exit(1); }
            console.log('    Creating: assets directory');
            console.log(' ');
            process.exit();
        });
    }
} else {

/***********************************************************************
 * MEAT!
 **********************************************************************/

/**
 * Libs
 */
var fs          = require('fs');
var path        = require('path');
var HTTPerf     = require('httperfjs');
var Phapper     = require('phapper');
var YSlow       = require('yslowjs');

var settings;
try {
    settings    = require(cli.args[0]||'./config.json');
} catch (e) {
    console.trace(e);
    process.exit(1);
}

[ 'host', 'path' , 'runs' ].forEach(function(p) {
    if (typeof cli[p] !== 'undefined') {
        settings[p] = cli[p];
    }
});

if (typeof cli.warmup !== 'undefined') { settings.warmup = true; }
if (typeof cli.debug  !== 'undefined') { settings.DEBUG  = true; }

var latest = './latest.js';
var storage;

if (typeof cli.output !== 'undefined') {
    storage = cli.output;
    fs.writeFileSync(latest, 'document.write(\'<script type="text/javascript" src="'+storage+'"></script>\');');
} else {
    var storage = latest;
}

var failed_test = false;

/**
 * Helpers
 */
function write() {
    console.log('\nWriting results to: %s', storage);
    fs.writeFileSync(storage, 'var thresholds = '
                     + JSON.stringify(settings.thresholds, null, 4)
                     + '\n\n'
                     + 'var results = '
                     + JSON.stringify(results, null, 4)
                     + '\n\nif (typeof window === \'undefined\') { '
                     + 'module.exports = { results: results, thresholds: thresholds}; }');
    console.log(' ');
    console.log('View results by opening \'./index.html\' in a browser.');
    console.log(' ');
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

function yslow() {
    return new YSlow(getUrl(settings.host, settings.path),
                     [ '--info', 'basic' ]);
}

/**
 * Benchmarks
 */
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

function warmup() {
    if (settings.warmup) {
        debug('WARMING UP!!');
        server().runSync();
        debug('DONE UP!!');
    }
}

function bench(name, benchObj) {
    debug('Building ' + name);
    return function (callback) {
        debug('Running server: ' + httpURI);
        try {
            benchObj.run( function (run, etc) {

                if (typeof etc === 'object') {
                    if (etc.error) {
                        debug('ERROR returned by run');
                        debug(JSON.stringify(etc, null, 4));
                        callback(etc.error);
                    }
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
            debug('ERROR during run');
            debug(JSON.stringify(e, null, 4));
            callback(e);
        }
    };
}

var benchmarks = { };

console.log('\nChecking: %s', httpURI);
console.log('------------------------------------------------------------');
benchmarks['server: '+httpURI] = bench('server', server());
benchmarks['client: '+httpURI] = bench('client', client());
benchmarks['yslow: '+httpURI] = bench('yslow', yslow());

Object.keys(benchmarks).forEach(function (bm) {
    benchmarks[bm](function (error) {
        if (error) { throw error; }
    });
});

/**
 * Finish up
 */
process.on('exit', function () {
    write();
    verify();
});

/**********************************************************************/

} // end cli:else

