# Globally-available dependencies
global.u = require('underscore')
global.u.str = require('underscore.string')
global.util = require('./util')
global.async = require('async')

global.PRODUCTION = process.env.NODE_ENV == 'production'

# Dependencies
http = require('http')
path = require('path')
fs = require('fs')
os = require('os')
child_process = require('child_process')
cluster = require('cluster')

express = require('express')
stylus = require('stylus')
nib = require('nib')


# Make all globals accessible from command line
module.exports = global

numCPUs = if PRODUCTION then os.cpus().length else 1
if (cluster.isMaster)
  # build stylus files
  log('Compiling stylus...')
  buildStylus = 'rm -rf static/css; mkdir -p static/css; ./node_modules/stylus/bin/stylus stylus/main.styl --use ./node_modules/nib/lib/nib --compress --out static/css'
  child_process.exec(buildStylus, {
    cwd: __dirname }
    , (err, stdout, stderr) ->
      if (err) then error(err); return
      log('Done.')
      log("Spawning #{numCPUs} worker processes...")
      # Fork workers.
      cluster.fork() for i in [1..numCPUs]

      cluster.on('exit', (worker, code, signal) ->
        log('worker ' + worker.process.pid + ' died')
      )
    )


else
  # Express application
  global.app = express()

  log('============')
  log('SERVER START')
  log('============')
  log("App running in '#{ app.get('env') }' mode.")

  PORT = if process.argv.length > 2 then process.argv[2] else 4000
  app.set('port', PORT)

  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'jade')

  if (PRODUCTION) then app.enable('view cache')

  app.disable('x-powered-by')
  app.enable('trust proxy') # express is behind nginx reverse proxy

  app.use(express.bodyParser())

  # app.use(express.methodOverride())
  # app.use(express.cookieParser('your secret here'))
  # app.use(express.session())

  if (PRODUCTION)
    app.use(express.logger('short'))
  else
    # Pretty html while developing
    app.locals.pretty = true

    # SSH tunnel to "athena" so we can access mongo database while developing locally
    # tunnel = require('child_process').spawn("ssh", ['-L', '27017:localhost:27017', '-N', 'feross@athena'])
    app.use(express.logger('dev')) # concise output colored by response status
    app.use(express.errorHandler({showStack: true, dumpExceptions: true}))
  
    # Serve static files from Node only during development
    app.use(express.static(path.join(__dirname, 'static')))


  app.use(app.router)

  # Allow access to the current environment from Jade
  app.locals.PRODUCTION = PRODUCTION

  # Load config after "app" is set up, since we access it there
  global.config = require('./config')

  require('./models')(->
    routes = require('./routes')

    # Start the server -- workers will all share a TCP connection
    http.createServer(app).listen(app.get('port'), ->
      log("Express server listening on port #{ app.get('port') }")
    )

  )

  # Ultimate fallback to catch and log exceptions so the node process doesn't crash
  process.on('uncaughtException', (err) ->
    error('WARNING: Node uncaughtException: ', err.stack)
  )
