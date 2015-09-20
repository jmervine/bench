
var Phapper = require('phapper');
var path    = require('path');
var fs = require('fs');

function Bench(url) {
  var phantomas = path.resolve(process.cwd(), 'node_modules', 'phantomas', 'phantomas.js');
  console.log(phantomas);
  this.phantomas = new Phapper(phantomas, ['--format=json', '--url='+url], { cwd: path.resolve(__dirname, 'phantomas')});
}

Bench.prototype.run = function (callback) {
    this.phantomas.run(function (result, resObj) {
        callback({ json: result, raw: resObj });
    });
};

module.exports = Bench;
