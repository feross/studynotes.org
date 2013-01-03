// Globally-available dependencies
global.u = global._ = require('underscore')
global.util = require('./util')
global.async = require('async')

global.PRODUCTION = process.env.NODE_ENV == 'production'
global.config = require('./config')

// Constants
var PORT = (process.argv.length > 2)
  ? process.argv[2]
  : 4000

// Paths to command-line programs
var STYLUS_PATH = './node_modules/stylus/bin/stylus'
  , NIB_PATH = './node_modules/nib/lib/nib'

// Dependencies
var http = require('http')
  , path = require('path')
  , fs = require('fs')
  , os = require('os')
  , child_process = require('child_process')
  , cluster = require('cluster')
  
  , express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')

// Make all globals accessible from command line
module.exports = global

// Number of cluster children to spawn
var numCPUs = PRODUCTION
  ? os.cpus().length
  : 1

if (cluster.isMaster) {
  // Build stylus files
  var buildStylus =
    'rm -rf static/css; mkdir -p static/css; ' +
    STYLUS_PATH + ' stylus/main.styl ' + 
    '--use ' + NIB_PATH + ' --compress --out static/css'

  child_process.exec( buildStylus
                    , { cwd: __dirname }
                    , function(err, stdout, stderr){
    if (err) {
      error(err)
      return
    }

    // Fork workers.
    u.times(numCPUs, function(i){
      cluster.fork()
    })

    cluster.on('exit', function (worker, code, signal){
      log('worker ' + worker.process.pid + ' died')
    })

    log('Spawned ' + numCPUs + ' worker processes.')
  })

} else {
  // Express application
  global.app = express()

  log('SERVER START in "' + app.get('env') + '" mode.')

  app.set('port', PORT)
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'jade')

  if (PRODUCTION)
    app.enable('view cache')

  app.disable('x-powered-by')
  app.enable('trust proxy') // express is behind nginx reverse proxy

  app.use(express.bodyParser())
  // app.use(express.methodOverride())
  // app.use(express.cookieParser('your secret here'))
  // app.use(express.session())

  if (PRODUCTION) {
    app.use(express.logger('short'))
  } else {
    // Pretty html while developing
    app.locals.pretty = true

    app.use(express.logger('dev')) // concise output colored by response status
    app.use(express.errorHandler({showStack: true, dumpExceptions: true}))
  
    // Serve static files from Node only during development
    app.use(express.static(path.join(__dirname, 'static')))
  }

  app.use(app.router)

  // Allow access to the current environment from Jade
  app.locals.PRODUCTION = PRODUCTION
  app.locals.util = util

  require('./models')(function (){
    var routes = require('./routes')

    // Start the server -- workers will all share a TCP connection
    http.createServer(app).listen(app.get('port'), function (){
      log('Express server listening on port ' + app.get('port'))
    })

  })

  // Catch and log exceptions so the node process doesn't crash
  process.on('uncaughtException', function (err){
    error('WARNING: Node uncaughtException: ', err.stack)
  })
}