
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , connect = require('connect');

var app = module.exports = express.createServer();

// Configuration

app.configure('production', function(){
  app.use(connect.logger());
});

app.configure('development', function(){
  app.use(connect.logger('dev'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('app root', process.cwd());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/:collection/keys',  routes.keys);
app.get('/:collection/urls',  routes.urls);
app.get('/:collection/data',  routes.data);
app.get('/:collection/count', routes.count);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
