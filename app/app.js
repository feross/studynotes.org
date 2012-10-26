
// Globally-available includes

global.config = require('./config');
global._ = require('underscore');
global.async = require('async');


// Dependencies

var http = require('http')
  , path = require('path')
  , fs = require('fs')
  , express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')
  , db = require('./db')
  , models = require('./model')
  , routes = require('./routes');


// Express application

var app = express();

app.set('port', process.env.PORT || 4000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here')); // TODO
app.use(express.session());

app.use(stylus.middleware({
  // "/stylesheets" gets automatically appended to the paths
  src: __dirname,
  dest: __dirname + '/public',
  compile: function(str, path) {
    return stylus(str)
      .set('filename', path)
      .define('url', stylus.url())
      .set('compress', app.get('env' !== 'development'))
      .use(nib());
  }
}));

app.use(express["static"](path.join(__dirname, 'public')));
app.use(app.router);

// Allow access to the current environment from Jade
app.locals.env = app.get('env');

if (app.get('env') === 'development') {
  app.locals.pretty = true;
  app.use(express.errorHandler());
}


// Routes

app.get('/', routes.index);
app.get('/ap-notes/:courseSlug/:noteTypeSlug/:noteSlug', routes.note);
app.get('/study-guides', routes.astore);
app.get('*', routes.notFound);


// Start the server

http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});