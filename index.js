// module.exports = Site

global.PORT = (process.argv.length > 2)
  ? process.argv[2]
  : 4000

global.async = require('async')
global.config = require('./config')

var _ = require('underscore')
var builder = require('./builder')
var cluster = require('cluster')
var debug = require('debug')('site')
var express = require('express')
var fs = require('fs')
var http = require('http')
var moment = require('moment')
var nib = require('nib')
var os = require('os')
var path = require('path')
var stylus = require('stylus')
var util = require('./util')

// Number of cluster children to spawn
var NUM_CPUS = config.isProd
  ? os.cpus().length
  : 1

if (cluster.isMaster) {
  builder.build(function (err, output) {
    if (err) {
      console.error(err)
    } else {
      // Fork workers.
      _.times(NUM_CPUS, function (i){
        var childEnv = {
          'CSS_MD5': output.cssMd5,
          'JS_MD5': output.jsMd5,
        }
        cluster.fork(childEnv)
      })

      cluster.on('exit', function (worker, code, signal){
        debug('worker ' + worker.process.pid + ' died')
      })

      debug('Spawned ' + NUM_CPUS + ' worker processes.')
    }

  })

} else {

  // Express application
  global.app = express()

  debug('SERVER START in "' + app.get('env') + '" mode.')

  app.set('port', PORT)
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'jade')

  if (config.isProd)
    app.enable('view cache')

  app.disable('x-powered-by')
  app.enable('trust proxy') // express is behind nginx reverse proxy

  app.use(express.bodyParser())

  // Make certain JS libraries available to Jade templates
  app.locals._ = _
  app.locals.moment = moment
  app.locals.util = util

  app.locals.CSS_MD5 = process.env['CSS_MD5']
  app.locals.JS_MD5 = process.env['JS_MD5']

  if (config.isProd) {
    app.use(express.logger('short'))

  } else {
    app.locals.pretty = true

    app.use(express.logger('dev')) // concise output colored by response status
    app.use(express.errorHandler({showStack: true, dumpExceptions: true}))

    // Serve static files from Node only during development
    app.use(express.static(path.join(__dirname, 'static')))
  }

  app.use(app.router)

  require('./models')(function (err){
    if (err) {
      console.error('Connecting to DB or loading models has failed, so server cannot start')
      return
    }
    var routes = require('./routes')

    // Start the server -- workers will all share a TCP connection
    http.createServer(app).listen(app.get('port'), function (){
      debug('StudyNotes listening on ' + app.get('port'))
    })

  })
}