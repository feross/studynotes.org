// Globally-available Dependencies
global.u = require('underscore');
global.u.str = require('underscore.string');
global.u.util = require('./utils');

global.async = require('async');

// Dependencies
var http = require('http')
  , path = require('path')
  , fs = require('fs')
  , express = require('express')
  , stylus = require('stylus')
  , nib = require('nib');



// Make all globals accessible from command line
module.exports = global;

// Express application
// TODO: figure out what all these options actually do!
global.app = express();

console.log('App running in "' + app.get('env') + '" mode.');

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
  force: true,
  // debug: true,
  compile: function (str, path) {
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
  // Pretty html while developing
  app.locals.pretty = true;

  // SSH tunnel to "athena" so we can access mongo database while developing locally
  // var tunnel = require('child_process').spawn("ssh", ['-L', '27017:localhost:27017', '-N', 'feross@athena']);

  // TODO: what is this?
  app.use(express.errorHandler());
}

// Load config after "app" is set up, since we access it there
global.config = require('./config');

require('./models')(function () {

  // var routes = require('./routes');

  // // Start the server
  // http.createServer(app).listen(app.get('port'), function () {
  //   console.log('Express server listening on port ' + app.get('port'));
  // });
});

var routes = require('./routes');

// Start the server
http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

process.on('uncaughtException', function (err) {
  console.log('WARNING: Node uncaughtException: ', err, err.stack);
});
