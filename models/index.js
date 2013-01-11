var mongoose = require('mongoose')

module.exports = function (callback){
  mongoose.set('debug', !PRODUCTION)

  async.series(
    [ function (cb){
        global.db =
          mongoose.createConnection( 'mongodb://' + 
                                     config.db.user + '@' + 
                                     config.db.host + ':' + 
                                     config.db.port + '/' + 
                                     config.db.database
                                     , { server: { poolSize: 20 } } )

        global.db.on('error', function (err){
          cb(err)
        })
        global.db.once('open', function (){
          cb(null)
        })
      }
    , function (cb){
        require('./models')(cb)
      }
    ]
  , function (err){
    if (err) {
      error("Error connecting to database.", err)
      callback(err)
    } else {
      console.log('Connected to database successfully.')
      callback(null)
    }
  })
}