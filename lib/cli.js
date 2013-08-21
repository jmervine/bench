/***********************************************************************
 * CLI
 **********************************************************************/
var cli  = require('commander');
var path = require('path');

cli
    .version('0.0.1')
    .usage('[options] [url]')
    .option('-d , --database  [DATBASE]' , 'can be mongodb connection string or json file path (default: ./database.json)')
    .option('-t , --collection  [COLLECTION]' , 'if mongodb, collection name (default: client)')
    .option('-r , --runs   [RUNS]'    , '[BENCH ONLY] number of runs (defult: 9)', parseInt)
    .option('-c , --config [CONFIG]'  , 'config file location');

cli
    .command('server')
    .description('run server')
    .action(function(){
        console.log('not yet implemented');
        process.exit(0);
    });

var staticCommand = false;
cli
    .command('static')
    .description('generate static display')
    .action(function(){
        staticCommand = true;
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

cli.runs       = cli.runs       || 9;
cli.database   = cli.database   || './database.json';
cli.collection = cli.collection || 'client';

cli.static = staticCommand;

module.exports = cli;
