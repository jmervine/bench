/***********************************************************************
 * CLI
 **********************************************************************/
var cli = require('commander');

cli
  .version('0.0.1')
  .usage('[options] [./config.js]')
  .option('-s , --host [HOST]'   , 'target host')
  .option('-p , --path [PATH]'   , 'target path')
  .option('-r , --runs [RUNS]'   , 'number of runs')
  .option('-o , --output [FILE]' , 'number of runs')
  .option('-w , --warmup'        , 'warmup hosts')
  .option('-d , --debug'         , 'debug messaging');

cli.on('--help', function(){
  console.log('  Notes:');
  console.log('  - Uses \'./config.js\' by default.');
  console.log('  - Options overide config file settings.');
  console.log(' ');
});

cli.parse(process.argv);
module.exports = cli;
