/***********************************************************************
 * CLI
 **********************************************************************/
var cli  = require('commander');
var path = require('path');

cli
    .version('0.0.1')
    .usage('[options] [url]')
    .option('-d , --database [DATBASE]'      , 'mongodb connection string')
    .option('-t , --collection [COLLECTION]' , 'mongodb collection name (default: client)')
    .option('-r , --runs [RUNS]'             , '[BENCH ONLY] number of runs (defult: 9)'    , parseInt)
    .option('-l , --limit [RUNS]'             , '[BENCH ONLY] number of runs (defult: cpus + 1)'    , parseInt)
    .option('-c , --config [CONFIG]'         , 'config file location');

cli
    .command('server')
    .description('run server')
    .action(function(){
        cli.action = 'server';
    });

cli.parse(process.argv);

if (cli.config) {
    var config = require(path.resolve(cli.config));
    Object.keys(config).forEach(function (key) {
        if (!cli[key]) {
            cli[key] = config[key];
        }
    });
}

if (cli.args[0]) {
    cli.url = cli.args[0];
}

if (!cli.url) {
    cli.help();
}

cli.action     = cli.action     || 'bench';

cli.runs       = cli.runs       || 9;
cli.limit      = cli.limit      || require('os').cpus().length + 1;
cli.database   = cli.database   || 'localhost/benchdb';
cli.collection = cli.collection || 'client';

module.exports = cli;
