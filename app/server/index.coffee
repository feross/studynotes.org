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

# Logging functions for convenience
global.log = ->
  args = Array.prototype.slice.call(arguments, 0)
  console.log.apply(console.log, args)

global.error = ->
  args = Array.prototype.slice.call(arguments, 0)
  args.unshift('ERROR:')
  console.error.apply(console.error, args)


# Make all globals accessible from command line
module.exports = global

# Express application
# TODO: figure out what all these options actually do!
global.app = express()

console.log("App running in '#{ app.get('env') }' mode.")

app.set('port', process.env.PORT || 4000)
app.set('views', path.join(__dirname, '../views'))
app.set('view engine', 'jade')
app.use(express.favicon())
app.use(express.logger('dev')) # TODO: what does this do?
app.use(express.bodyParser()) # TODO: what does this do?
app.use(express.methodOverride()) # TODO: what does this do?
app.use(express.cookieParser('your secret here')) # TODO
app.use(express.session()) # TODO: what does this do?

# Serve client coffeescript and stylus files
app.use(assets({
  src: path.join(__dirname, '..')
  buildDir: false
}))

app.use(express.static(path.join(__dirname, '..', 'public')))
app.use(slashes())
app.use(app.router)

# Allow access to the current environment from Jade
app.locals.env = app.get('env')


if (app.get('env') == 'development')
  # Pretty html while developing
  app.locals.pretty = true

  # SSH tunnel to "athena" so we can access mongo database while developing locally
  # tunnel = require('child_process').spawn("ssh", ['-L', '27017:localhost:27017', '-N', 'feross@athena'])

  app.use(express.errorHandler()) # TODO: what is this?

# Load config after "app" is set up, since we access it there
global.config = require('./config')

require('./models')(->
  routes = require('./routes')

  # Start the server
  http.createServer(app).listen(app.get('port'), ->
    console.log("Express server listening on port #{ app.get('port') }")
  )
)

# Ultimate fallback to catch and log exceptions so the node process doesn't crash
process.on('uncaughtException', (err) ->
  console.error('WARNING: Node uncaughtException: ', err.stack)
)
