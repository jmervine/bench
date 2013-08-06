#! /usr/bin/env node
var fs      = require('fs');
var path    = require('path');
var cli     = require('./lib/cli');
var init    = require('./lib/init');
var util    = require('./lib/util');
var HTTPerf = require('httperfjs');
var Phapper = require('phapper');
var YSlow   = require('yslowjs');

/***********************************************************************
 * Functions
 **********************************************************************/
    function write() {
        util.debug(' => Writing results to: %s', storage);
        fs.writeFileSync(storage, 'var thresholds = '
                         + util.json(settings.thresholds)
                         + '\n\n'
                         + 'var results = '
                         + util.json(results)
                         + '\n\nif (typeof window === \'undefined\') { '
                         + 'module.exports = { results: results, thresholds: thresholds}; }');
        console.log('------------------------------------------------------------');
        console.log('View results by opening \'./index.html\' in a browser.');
        console.log('------------------------------------------------------------');
    }

    function verify() {
        if (tested_keys.length !== Object.keys(settings.thresholds).length) {
            console.error('ERROR: Not all tests were run.');
            console.error('Tested:\n' + util.json(tested_keys));
            console.error('\nExpected:\n' + util.json(Object.keys(settings.thresholds)));
            exitstatus = 1;
        }

        if (failed_test) {
            exitstatus = 1;
        }
    }

    function warmup() {
        if (settings.warmup) {
            util.debug('WARMING UP!!');
            server.runSync();
            util.debug('DONE UP!!');
        }
    }

    function bench(name, benchObj) {
        util.debug('Building ' + name);
        return function (callback) {
            util.debug('Running server: ' + url);
            try {
                benchObj.run( function (run, etc) {

                    if (typeof etc === 'object') {
                        if (etc.error) {
                            util.debug('ERROR returned by run');
                            util.debug_as_json(etc);
                            callback(etc.error);
                        }
                    }

                    if (name === 'client') { run = run.metrics; }
                    results[rindex][name] = run;
                    Object.keys(settings.thresholds).forEach( function (key) {
                        util.debug('checking ' + key);
                        var stat = '+';
                        if (run.hasOwnProperty(key)) {
                            tested_keys.push(key);
                            if (key === 'o') {
                                util.debug('omg \'o\'');
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
                util.debug('ERROR during run');
                util.debug_as_json(e);
                callback(e);
            }
        };
    }

/***********************************************************************
 * Handle 'init'
 **********************************************************************/
if (process.argv[2] === 'init') {
    init();
} else {

/***********************************************************************
 * MEAT!
 **********************************************************************/
    var latest      = './latest.js';
    var failed_test = false;
    var tested_keys = [];
    var benchmarks  = { };
    var exitstatus  = 0;
    var settings;
    var storage;
    var results;
    var url;
    var rindex;
    var server;
    var client;
    var yslow;

    try {
        settings = require(cli.args[0]||'./config.json');
    } catch (e) {
        console.trace(e);
    }

    [ 'host', 'path' , 'runs' ].forEach(function(p) {
        if (typeof cli[p] !== 'undefined') {
            settings[p] = cli[p];
        }
    });

    if (typeof cli.warmup !== 'undefined') { settings.warmup = true; }
    if (typeof cli.debug  !== 'undefined') { settings.DEBUG  = true; }
    if (typeof cli.output !== 'undefined') {
        storage = cli.output;
        fs.writeFileSync(latest, 'document.write(\'<script type="text/javascript" src="'+storage+'"></script>\');');
    } else {
        storage = latest;
    }

    util.debug_as_json(settings);
    if (settings.DEBUG) { process.env.DEBUG = true; }

    /**********************************************************************
     * Benchmarks
    ***********************************************************************/
    url    = util.url(settings);
    server = new HTTPerf({ server: settings.host, verbose: true, uri: settings.path, 'num-conns': settings.runs });
    client = new Phapper('./phantomas.js', ['--format=json', '--url='+url], { cwd: path.resolve(__dirname, 'lib', 'phantomas')});
    yslow  = new YSlow(url, [ '--info', 'basic' ]);


    try {
        results = require(path.resolve(process.cwd(), storage)).results;
    } catch(e) {
        console.log('Warning: couldn\'t find previous results (@ %s), creating.', storage);
        results = [];
    }

    rindex = results.length;

    if (rindex === 10) {
        results.shift();
        rindex--;
    }
    results.push({});

    console.log('\nChecking: %s', url);
    console.log('------------------------------------------------------------');
    console.log(' ');
    benchmarks['server: '+url] = bench('server', server);
    benchmarks['client: '+url] = bench('client', client);
    benchmarks['yslow: ' +url] = bench('yslow',  yslow);

    results[rindex].date = new Date();
    Object.keys(benchmarks).forEach(function (bm) {
        benchmarks[bm](function (error) {
            if (error) {
                console.trace(error);
                exitstatus = 1;
            }
        });
    });

    /**
     * Finish up
     */
    process.on('exit', function () {
        write();
        verify();
        process.exit(exitstatus);
    });
}

