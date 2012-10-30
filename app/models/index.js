module.exports = function(cb) {
  var mongoose = require('mongoose');

  mongoose.set('debug', app.get('env') == 'development');

  // Connect to database
  global.db = mongoose.createConnection('mongodb://' + config.db.user + ':' + config.db.pass + '@' + config.db.host + ':' + config.db.port + '/' + config.db.database);

  var models = require('./models');

  db.on('error', function (err) {
    console.error("Error connecting to database.", err);
  });
  db.once('open', function () {
    console.log('Connected to database successfully.');
    cb();
  });
}