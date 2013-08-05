var fs   = require('fs');
var ncp  = require('ncp').ncp;
var path = require('path');

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

module.exports = function() {
    console.log(' ');
    console.log('  bench init ');
    console.log(' ');

    var source = path.resolve(__dirname, '..');
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
}
