// Models

var mongoose = require('mongoose');

mongoose.set('debug', app.get('env') == 'development');

global.m = {};
var db = global.m.db = mongoose.createConnection('mongodb://' + config.db.user + ':' + config.db.pass + '@' + config.db.host + ':' + config.db.port + '/' + config.db.database);

db.on('error', function (err) {
  console.error("Error connecting to database.", err);
});

// TODO: generalize schema+model creation so this isn't so verbose and error-prone.

var models = require('./models');

module.exports = function(cb) {

  db.once('open', function () {
    console.log('Connected to database successfully!');
    cb(null);
  });
}