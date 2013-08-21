
var Phapper = require('phapper');
var path    = require('path');
var fs = require('fs');

function Bench(url) {
    this.phantomas = new Phapper('./phantomas.js', ['--format=json', '--url='+url], { cwd: path.resolve(__dirname, 'phantomas')});
}

Bench.prototype.run = function (callback) {
    this.phantomas.run(function (result, resObj) {
        callback({ json: result, raw: resObj });
    });
};

module.exports = Bench;
