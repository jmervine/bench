var mongojs   = require('mongojs');
var col       = process.env.collection;

module.exports = {
    index: function(req, res){
      res.render('index', { title_text: req.title_text, title_link: req.title_link });
    },
    keys: function(req, res) {
        var start = Date.now();
        var db = mongojs(process.env.database, [ col ]);
        db[col]
            .findOne({},{metrics:-1},function(err, result) {
                if (err) { res.send(500); db.close(); return; }
                res.json(Object.keys(result.metrics));
                db.close();
            });
    },
    urls: function(req, res) {
        var db = mongojs(process.env.database, [ col ]);
        db[col]
            .distinct('url', function(err, results) {
                if (err) { res.send(500); db.close(); return; }
                res.json(results);
                db.close();
            });
    },
    count: function (req, res) {
        var db = mongojs(process.env.database, [ col ]);
        db[col]
            .find((req.query.url ? {url: req.query.url} : {}))
            .count(function(err, count) {
                if (err) { res.send(500); db.close(); return; }
                res.json(count);
                db.close();
            });
    },
    data: function(req, res){
        var db = mongojs(process.env.database, [ col ]);
        var limit = parseInt(req.query.limit, 10) || 10;

        db[col]
            .find((req.query.url ? {url: req.query.url} : {}), {url:1, metrics:1, created_at:1})
            .sort({created_at:1},
            function(err, results) {
                if (err) { res.send(500); db.close(); return; }
                switch(req.query.start) {
                    case 'undefined'||undefined:
                        res.json(results.splice(-limit));
                        break;
                    case '0':
                        res.json(results.splice(0,limit));
                        break;
                    default:
                        res.json(results.splice(parseInt(req.query.start,10),limit));
                }
                db.close();
            });
    }
};
