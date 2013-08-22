var path = require('path');

module.exports = {
    index: function(req, res){
      res.render('index', { title: 'Bench' });
    },
    database: function(req, res){
        res.json(require(path.resolve(__dirname, '..', '..', 'database.json')));
    }
};
