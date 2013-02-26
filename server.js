// Constants
global.PRODUCTION = process.env.NODE_ENV == 'production'
global.PORT = (process.argv.length > 2)
  ? process.argv[2]
  : 4000

// Globally-available dependencies
global.util = require('futils')
global.async = require('async')
global.config = require('./config')

util.easyLog()

// Dependencies
var http = require('http')
  , path = require('path')
  , fs = require('fs')
  , os = require('os')
  , cluster = require('cluster')
  , _ = require('underscore')
  , express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')
  , moment = require('moment')
  , build = require('simple-build')

build = build({
  outPath: path.join(__dirname, 'static/build'),
  production: PRODUCTION,
  jsPrefix: path.join(__dirname, 'static'),
  js: [
    [
      'components/jquery/jquery.js',
      'components/jquery/jquery.min.js'
    ]
    , [
      'components/underscore/underscore.js',
      'components/underscore/underscore-min.js'
    ]
    , [
      'components/transparency/lib/transparency.js',
      'components/transparency/lib/transparency.min.js'
    ]
    , [
      'components/keymaster/keymaster.js',
      'components/keymaster/keymaster.min.js'
    ]
    , 'components/moment/moment.js'
    , 'js/util.js'
    , 'js/countdown.js'
    , 'js/client.js'
  ],
  stylus: path.join(__dirname, 'stylus/main.styl')
})

// Make all globals accessible from command line
module.exports = global

// Number of cluster children to spawn
var NUM_CPUS = PRODUCTION
  ? os.cpus().length
  : 1

if (cluster.isMaster) {
  build.build(function (err, output) {
    if (err) { error(err); return }

    log(output.JS_FILENAMES)
    // Fork workers.
    _.times(NUM_CPUS, function (i){
      var childEnv = {
        'CSS_MD5': output.css,
        'JS_MD5': output.js,
      }
      cluster.fork(childEnv)
    })

    cluster.on('exit', function (worker, code, signal){
      log('worker ' + worker.process.pid + ' died')
    })

    log('Spawned ' + NUM_CPUS + ' worker processes.')
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

  // Make certain JS libraries available to Jade templates
  app.locals.PRODUCTION = PRODUCTION
  app.locals._ = _
  app.locals.util = util
  app.locals.moment = moment

  if (PRODUCTION) {
    app.use(express.logger('short'))
    app.locals.CSS_MD5 = process.env['CSS_MD5']
    app.locals.JS_MD5 = process.env['JS_MD5']
  } else {
    app.locals.pretty = true
    app.locals.JS_FILENAMES = build.JS_FILENAMES

    app.use(express.logger('dev')) // concise output colored by response status
    app.use(express.errorHandler({showStack: true, dumpExceptions: true}))

    // Serve static files from Node only during development
    app.use(express.static(path.join(__dirname, 'static')))
  }

  app.use(app.router)



  require('./models')(function (err){
    if (err) {
      error('Connecting to DB or loading models has failed, so server cannot start')
      return
    }
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