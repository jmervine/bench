/***********************************************************************
 * CLI
 **********************************************************************/
var cli  = require('commander');
var base = require('path').basename;
var o    = console.log;

cli
    .version('0.0.1')
    .usage('[options] [./config.js]')
    .option('-s , --host [HOST]'   , 'target host')
    .option('-p , --path [PATH]'   , 'target path')
    .option('-r , --runs [RUNS]'   , 'number of runs')
    .option('-o , --output [FILE]' , 'output.js (warning: this can destory data)')
    .option('-w , --warmup'        , 'warmup hosts')
    .option('-d , --debug'         , 'debug messaging');

cli.on('--help', function(){
    o('    Notes:');
    o('    - Uses \'./config.js\' by default.');
    o('    - Options overide config file settings.');
    o(' ');
    o(' ');
    o('  Usage: '+base(process.argv[1])+' init');
    o(' ');
    o('    Creates needed files in current working directory.');
    o('    - config.json - default configuration.');
    o('    - latest.js   - data storage.');
    o('    - index.html  - results viewer.');
    o(' ');
    o('    WARNING: This will overwrite configs and data.');
    o(' ');
});

cli.parse(process.argv);
module.exports = cli;
