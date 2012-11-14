module.exports = function(callback) {
  var mongoose = require('mongoose');

  mongoose.set('debug', app.get('env') == 'development');

  async.series([
    function(cb) {
      global.db = mongoose.createConnection('mongodb://' + config.db.user + ':' + config.db.pass + '@' + config.db.host + ':' + config.db.port + '/' + config.db.database);

      global.db.on('error', function (err) {
        cb(err);
      });
      global.db.once('open', function () {
        cb(null);
      });
    },
    function(cb) {
      require('./models')(cb);
    }
  ], function(err) {
    if (err) {
      console.error("Error connecting to database.", err);
      callback(err);
    } else {
      console.log('Connected to database successfully.');
      callback(null);
    }
  });

};