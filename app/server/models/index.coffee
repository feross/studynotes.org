module.exports = (callback) ->
  mongoose = require('mongoose')

  mongoose.set('debug', app.get('env') == 'development')

  async.series([
    (cb) ->
      global.db = mongoose.createConnection("mongodb://#{ config.db.user }:#{ config.db.pass }@#{ config.db.host }:#{ config.db.port }/#{ config.db.database }")

      global.db.on('error', (err) ->
        cb(err)
      )
      global.db.once('open', () ->
        cb(null)
      )
    ,
    (cb) ->
      require('./models')(cb)
  ],
  (err) ->
    if (err)
      error("Error connecting to database.", err)
      callback(err)
    else
      console.log('Connected to database successfully.')
      callback(null)
  )