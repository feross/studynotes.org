module.exports = Site

var bodyParser = require('body-parser')
var cluster = require('cluster')
var compress = require('compression')
var connectMongo = require('connect-mongo')
var connectSlashes = require('connect-slashes')
var cookieParser = require('cookie-parser')
var csrf = require('csurf')
var debug = require('debug')('studynotes:site')
var express = require('express')
var favicon = require('serve-favicon')
var flash = require('connect-flash')
var http = require('http')
var jade = require('jade')
var moment = require('moment')
var nib = require('nib')
var passport = require('passport')
var path = require('path')
var series = require('run-series')
var session = require('express-session')
var stylus = require('stylus')
var supportsColor = require('supports-color')
var url = require('url')

var auth = require('./lib/auth')
var config = require('./config')
var model = require('./model')
var pro = require('./lib/pro')
var secret = require('./secret')
var util = require('./util')

jade.filters.style = function (str) {
  var ret
  stylus(str, { compress: config.isProd })
    .use(nib())
    .render(function (err, css) { // sync
      if (err) throw err
      ret = css
    })
  return '<style>' + ret + '</style>'
}

function Site (opts, done) {
  var self = this
  self.port = opts.port || config.ports.site

  self.id = cluster.isMaster ? 'master' : 'worker ' + cluster.worker.id
  self.debug('started')

  if (cluster.isMaster) {
    cluster.setupMaster({ exec: __filename })
    self.debug('Master process will spawn %d workers', config.numCpus)

    for (var i = 0; i < config.numCpus; i++) {
      cluster.fork()
    }
    cluster.on('exit', function (worker, code) {
      console.error('worker %s died: %s', worker.id, code)
    })

    var remaining = config.numCpus
    cluster.on('listening', function (worker, address) {
      remaining -= 1
      if (remaining === 0) done(null)
    })
    return
  }

  self.app = express()
  self.server = http.createServer(self.app)

  // Trust the X-Forwarded-* headers from nginx
  self.app.enable('trust proxy')

  // Use Jade templates
  self.app.set('views', path.join(__dirname, 'views'))
  self.app.set('view engine', 'jade')
  self.app.engine('jade', jade.renderFile)

  // Make variables and functions available to Jade templates
  self.app.locals.config = config
  self.app.locals.modelCache = model.cache
  self.app.locals.moment = moment
  self.app.locals.pretty = !config.isProd
  self.app.locals.random = Math.random
  self.app.locals.stripe = { publishable: secret.stripe.publishable }
  self.app.locals.util = util

  // Gzip responses
  self.app.use(compress())

  self.app.use(function (req, res, next) {
    var extname = path.extname(url.parse(req.url).pathname)

    // Add cross-domain header for fonts, required by spec, Firefox, and IE.
    if (['.eot', '.ttf', '.otf', '.woff', '.woff2'].indexOf(extname) >= 0) {
      res.header('Access-Control-Allow-Origin', '*')
    }

    // Prevents IE and Chrome from MIME-sniffing a response. Reduces exposure to
    // drive-by download attacks on sites serving user uploaded content.
    res.header('X-Content-Type-Options', 'nosniff')

    // Prevent rendering of site within a frame.
    res.header('X-Frame-Options', 'DENY')

    // Enable the XSS filter built into most recent web browsers. It's usually
    // enabled by default anyway, so role of this headers is to re-enable for this
    // particular website if it was disabled by the user.
    res.header('X-XSS-Protection', '1; mode=block')

    // Force IE to use latest rendering engine or Chrome Frame
    res.header('X-UA-Compatible', 'IE=Edge,chrome=1')

    // Redirect to canonical urls
    if (config.isProd && req.method === 'GET') {
      if (req.hostname !== 'www.apstudynotes.org') {
        self.debug('Redirecting %s to canonical domain', req.hostname + req.url)
        return res.redirect(301, config.siteOrigin + req.url)
      } else if (req.protocol !== 'https') {
        self.debug('Redirecting %s to https domain', req.hostname + req.url)
        return res.redirect(301, config.siteOrigin + req.url)
      }
    }

    // Strict transport security for 1 year (to force HTTPS and prevent MITM attacks)
    if (config.isProd) {
      res.header('Strict-Transport-Security', 'max-age=31536000')
    }

    next()
  })

  self.serveStatic()
  self.app.use(connectSlashes())

  // Express middleware that logs requests using the "debug" module so that the
  // output is hidden by default. Enable with DEBUG=* environment variable.
  self.app.use(function (req, res, next) {
    self.debug(
      (supportsColor ? '\x1B[90m' : '') + req.method + ' ' + req.originalUrl +
      (supportsColor ? '\x1B[0m' : '')
    )
    next()
  })

  self.app.use(function (req, res, next) {
    res.locals.req = req
    next()
  })

  self.setupSessions()
  self.app.use(pro.checkPro)

  // Errors are propogated using `req.flash`
  self.app.use(flash())

  require('./routes')(self.app)

  series([
    model.connect,
    function (cb) {
      // Start HTTP server -- workers will share TCP connection
      self.server.listen(self.port, cb)
    }
  ], function (err) {
    if (!err) self.debug('listening on ' + self.port)
    done(err)
  })
}

Site.prototype.debug = function () {
  var self = this
  var args = [].slice.call(arguments)
  args[0] = '[' + self.id + '] ' + args[0]
  debug.apply(null, args)
}

Site.prototype.serveStatic = function () {
  var self = this

  // Favicon middleware makes favicon requests fast
  self.app.use(favicon(path.join(config.root, 'static/favicon.ico')))

  // Setup static middlewares
  var opts = { maxAge: config.maxAge }
  var stat = express.static(config.root + '/static', opts)
  var out = express.static(config.root + '/out', opts)
  var nodeModules = express.static(config.root + '/node_modules', opts)
  var lib = express.static(config.root + '/lib', opts)

  // Serve static files, they take precedence over the routes.
  self.app.use(stat)

  // HACK: Make CSS relative URLs work in development
  if (!config.isProd) {
    self.app.use('/cdn', express.static(config.root + '/lib/select2', opts))
  }

  // Also mount the static files at "/cdn", without routes. This is so that
  // we can point the CDN at this folder and have it mirror ONLY the static
  // files, no other site content.
  self.app.use('/cdn', stat)
  self.app.use('/cdn', out)
  self.app.use('/cdn', nodeModules)
  self.app.use('/cdn', lib)
  self.app.use('/cdn', function (req, res) {
    res.status(404).send()
  })
}

Site.prototype.setupSessions = function () {
  var self = this

  self.app.use(cookieParser(secret.cookieSecret))

  // parse application/x-www-form-urlencoded
  self.app.use(bodyParser.urlencoded({ extended: false }))

  // parse application/json
  self.app.use(bodyParser.json())

  var MongoStore = connectMongo(session)
  self.app.use(session({
    proxy: true, // trust the reverse proxy
    resave: false, // don't save if session is unmodified
    saveUninitialized: false, // don't save new/unmodified sessions
    secret: secret.cookieSecret, // prevent cookie tampering
    store: new MongoStore({
      db: config.mongo.database,
      host: config.mongo.host,
      port: config.mongo.port
    })
  }))
  self.app.use(csrf())

  // Passport
  self.app.use(passport.initialize())
  self.app.use(passport.session())
  passport.serializeUser(auth.serializeUser)
  passport.deserializeUser(auth.deserializeUser)
  passport.use(auth.passportStrategy)

  self.app.use(function (req, res, next) {
    res.locals.csrf = req.csrfToken()
    next()
  })
}

if (!module.parent) util.run(Site)
