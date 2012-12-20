# Globally-available dependencies
global.u = require('underscore')
global.u.str = require('underscore.string')
global.util = require('./util')
global.async = require('async')

# Dependencies
http = require('http')
path = require('path')
fs = require('fs')
express = require('express')
stylus = require('stylus')
nib = require('nib')
slashes = require('connect-slashes')
assets = require('connect-assets')
cluster = require('cluster')
os = require('os')
child_process = require('child_process')


# Make all globals accessible from command line
module.exports = global

numCPUs = os.cpus().length
if (cluster.isMaster)
  # build stylus files
  buildStylus = 'mkdir -p builtAssets; ./node_modules/stylus/bin/stylus stylus/main.styl --use ./node_modules/nib/lib/nib --compress --out builtAssets'
  child_process.exec(buildStylus, {
    cwd: path.join(__dirname, '..', '..') }
    , (err, stdout, stderr) ->
      if (err) then error(err); return

      log("Spawning #{numCPUs} worker processes...")
      # Fork workers.
      cluster.fork() for i in [1..numCPUs]

      cluster.on('exit', (worker, code, signal) ->
        log('worker ' + worker.process.pid + ' died')
      )
    )


else
  # Workers can share any TCP connection


  # Express application
  # TODO: figure out what all these options actually do!
  global.app = express()

  log('============')
  log('SERVER START')
  log('============')
  log("App running in '#{ app.get('env') }' mode.")

  PORT = if process.argv.length > 2 then process.argv[2] else 4000
  app.set('port', PORT)

  app.set('views', path.join(__dirname, '../views'))
  app.set('view engine', 'jade')
  if (app.get('env') == 'production')
    app.enable('view cache')

  app.disable('x-powered-by')
  app.enable('trust proxy') # express is behind nginx reverse proxy

  app.use(express.bodyParser())

  # app.use(express.methodOverride()) # TODO: what does this do?
  # app.use(express.cookieParser('your secret here')) # TODO
  # app.use(express.session()) # TODO: what does this do?

  if (app.get('env') == 'development')
    # Pretty html while developing
    app.locals.pretty = true

    # SSH tunnel to "athena" so we can access mongo database while developing locally
    # tunnel = require('child_process').spawn("ssh", ['-L', '27017:localhost:27017', '-N', 'feross@athena'])
    app.use(express.logger('dev')) # concise output colored by response status
    app.use(express.errorHandler({showStack: true, dumpExceptions: true})) # TODO: what is this?

  else if (app.get('env') == 'production')
    app.use(express.logger('short'))

  # Serve static files from Node only during development
  if (app.get('env') == 'development')
    app.use(express.static(path.join(__dirname, '..', '..', 'static')))

  app.use(slashes())
  app.use(app.router)

  # Allow access to the current environment from Jade
  app.locals.env = app.get('env')


  # Load config after "app" is set up, since we access it there
  global.config = require('./config')

  require('./models')(->
    routes = require('./routes')

    # Start the server
    http.createServer(app).listen(app.get('port'), ->
      log("Express server listening on port #{ app.get('port') }")
    )

  )

  # Ultimate fallback to catch and log exceptions so the node process doesn't crash
  process.on('uncaughtException', (err) ->
    error('WARNING: Node uncaughtException: ', err.stack)
  )
