module.exports = Site

var cluster = require('cluster')
var debug = require('debug')('studynotes:site')
var express = require('express')
var extend = require('xtend/mutable')
var http = require('http')
var moment = require('moment')
var path = require('path')
var series = require('run-series')
var url = require('url')

// Express middleware
var bodyParser = require('body-parser')
var compress = require('compression')
var connectMongo = require('connect-mongo')
var connectSlashes = require('connect-slashes')
var cookieParser = require('cookie-parser')
var csrf = require('csurf')
var favicon = require('serve-favicon')
var flash = require('connect-flash')
var passport = require('passport')
var session = require('express-session')

// Local dependencies
var auth = require('./lib/auth')
var config = require('./config')
var model = require('./model')
var pro = require('./lib/pro')
var secret = require('./secret')
var util = require('./util')

function Site (opts, done) {
  var self = this

  extend(self, {
    port: config.ports.site,
    offline: false
  }, opts)

  if (cluster.isMaster) {
    cluster.setupMaster({ exec: __filename })
    debug('Master process will spawn %d workers', config.numCpus)

    for (var i = 0; i < config.numCpus; i++) {
      cluster.fork()
    }
    cluster.on('exit', function (worker, code) {
      console.error('Worker %s died (%s)', worker.id, code)
    })
    done(null)
  } else {
    debug('Worker process %s started', cluster.worker.id)
    self.app = express()
    self.server = http.createServer(self.app)

    // Trust the X-Forwarded-* headers from nginx
    self.app.enable('trust proxy')

    // Use Jade templates
    self.app.set('views', path.join(__dirname, 'views'))
    self.app.set('view engine', 'jade')

    // Make variables and functions available to Jade templates
    self.app.locals.config = config
    self.app.locals.modelCache = model.cache
    self.app.locals.moment = moment
    self.app.locals.offline = self.offline
    self.app.locals.pretty = true
    self.app.locals.random = Math.random
    self.app.locals.stripe = { publishable: secret.stripe.publishable }
    self.app.locals.util = util

    // Gzip responses
    self.app.use(compress())

    self.app.use(function (req, res, next) {
      var extname = path.extname(url.parse(req.url).pathname)

      // Add cross-domain header for fonts, required by spec, Firefox, and IE.
      if (['.eot', '.ttf', '.otf', '.woff'].indexOf(extname) >= 0) {
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

      if (config.isProd && req.method === 'GET') {
        if (req.hostname !== 'www.apstudynotes.org') {
          debug('Redirecting alternate domain: ' + req.hostname)
          res.redirect(301, config.siteOrigin + req.url)
        } else if (req.protocol !== 'https') {
          debug('Forcing https: ' + req.url)
          res.redirect(301, config.siteOrigin + req.url)
        } else {
          next()
        }
      } else {
        next()
      }
    })

    self.serveStatic()
    self.app.use(connectSlashes())

    // Readable logs that are hidden by default. Enable with DEBUG=*
    self.app.use(expressLogger)

    self.app.use(function (req, res, next) {
      res.locals.req = req
      next()
    })

    self.setupSessions()
    self.app.use(pro.checkPro)

    if (config.isProd) self.app.use(self.sslForAuthedUsers)

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
      if (!err) debug('studynotes listening on ' + self.port)
      done(err)
    })
  }
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
    self.app.use('/fonts', express.static(config.root + '/node_modules/font-awesome/fonts', opts))
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

/**
 * Express middleware that logs requests using the "debug" module so that the
 * output is hidden by default.
 */
function expressLogger (req, res, next) {
  var str = '\x1B[90m' + req.method + ' ' + req.originalUrl + '\x1B[0m'
  debug(str)
  next()
}

if (!module.parent) util.run(Site)
