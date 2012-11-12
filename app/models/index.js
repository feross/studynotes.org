module.exports = function(callback) {
  var mongoose = require('mongoose');

  mongoose.set('debug', app.get('env') == 'development');

  global.db = mongoose.createConnection('mongodb://' + config.db.user + ':' + config.db.pass + '@' + config.db.host + ':' + config.db.port + '/' + config.db.database);

  async.series([
    function(cb) {
      require('./models')(cb);
    },
    function(cb) {
      // Connect to database
      global.db.on('error', function (err) {
        console.error("Error connecting to database.", err);
      });
      global.db.once('open', function () {
        console.log('hey');
        console.log('Connected to database successfully.');
        callback(null);
        cb();
        console.log('HEY');
      });
    }
  ]);

};