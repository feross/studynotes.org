module.exports = Site

var cluster = require('cluster')
var debug = require('debug')('studynotes:site')
var express = require('express')
var extend = require('extend.js')
var http = require('http')
var moment = require('moment')
var path = require('path')
var series = require('run-series')
var url = require('url')

/**
 * Express middleware
 */
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

/**
 * Keys, passwords, etc.
 */
var secret = require('./secret')

/**
 * Library modules
 */
var auth = require('./lib/auth')
var config = require('./config')
var email = require('./lib/email')
var model = require('./model')
var pro = require('./lib/pro')
var util = require('./util')


function Site (opts, cb) {
  var self = this
  if (opts) extend(self, opts)

  /** @type {number} port */
  self.port || (self.port = config.ports.site)

  /** @type {boolean} offline mode? */
  self.offline || (self.offline = false)

  self.start(cb)
}

Site.prototype.start = function (done) {
  var self = this
  done || (done = function () {})

  if (cluster.isMaster) {
    console.log('Master process will spawn ' + config.numCpus + ' workers')

    cluster.setupMaster({
      exec: __filename
    })

    for (var i = 0; i < config.numCpus; i++) {
      cluster.fork()
    }
    cluster.on('exit', function (worker, code) {
      console.error('Worker %s died (%s)', worker.id, code)
    })
    done(null)

  } else {
    console.log('Worker process %s started', cluster.worker.id)
    self.app = express()
    self.server = http.createServer(self.app)

    // Trust the X-Forwarded-* headers from nginx
    self.app.enable('trust proxy')

    // Templating
    self.app.set('views', path.join(__dirname, 'views'))
    self.app.set('view engine', 'jade')
    self.addTemplateGlobals()

    // Readable logs that are hidden by default. Enable with DEBUG=*
    self.app.use(util.expressLogger(debug))
    self.app.use(compress())
    self.app.use(self.addHeaders)

    if (config.isProd)
      self.app.use(self.canonicalize)

    self.serveStatic()
    self.app.use(connectSlashes())

    self.setupSessions()
    self.app.use(pro.checkPro)

    if (config.isProd)
      self.app.use(self.sslForAuthedUsers)

    // Errors are propogated using `req.flash`
    self.app.use(flash())

    self.app.use(self.addTemplateLocals)

    require('./routes')(self.app)

    series([
      model.connect,
      function (cb) {
        // Start HTTP server -- workers will share TCP connection
        self.server.listen(self.port, cb)
      }
    ], function (err) {
      if (!err) {
        debug('StudyNotes listening on ' + self.port)
        email.notifyAdmin('StudyNotes server started')
        if (!config.isProd) util.triggerLiveReload()
      }
      done(err)
    })
  }
}

/**
 * Make variables and functions available to Jade templates.
 */
Site.prototype.addTemplateGlobals = function () {
  var self = this

  self.app.locals.config = config
  self.app.locals.modelCache = model.cache
  self.app.locals.moment = moment
  self.app.locals.offline = self.offline
  self.app.locals.pretty = true
  self.app.locals.random = Math.random
  self.app.locals.stripe = { publishable: secret.stripe.publishable }
  self.app.locals.util = util
}

Site.prototype.addHeaders = function (req, res, next) {
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

  next()
}

Site.prototype.canonicalize = function (req, res, next) {
  if (req.hostname !== 'www.apstudynotes.org') {
    // redirect alternate domains to homepage
    res.redirect(301, req.protocol + ':' + config.siteOrigin + req.url)
  } else {
    next()
  }
}

// Redirect HTTP to HTTPS for authenticated users
Site.prototype.sslForAuthedUsers = function (req, res, next) {
  if (req.isAuthenticated() && req.protocol !== 'https') {
    res.redirect(config.secureSiteOrigin + req.url)
  } else {
    next()
  }
}

Site.prototype.serveStatic = function () {
  var self = this

  // Favicon middleware makes favicon requests fast
  self.app.use(favicon(path.join(config.root, 'static/favicon.ico')))

  // Setup static middlewares
  var opts = { maxAge: config.maxAge }
  var static = express.static(config.root + '/static', opts)
  var out = express.static(config.root + '/out', opts)
  var nodeModules = express.static(config.root + '/node_modules', opts)
  var lib = express.static(config.root + '/lib', opts)

  // Serve static files, they take precedence over the routes.
  self.app.use(static)

  // HACK: Make CSS relative URLs work in development
  if (!config.isProd)
    self.app.use('/fonts', express.static(config.root + '/node_modules/font-awesome/fonts', opts))
    self.app.use('/cdn', express.static(config.root + '/lib/select2', opts))

  // Also mount the static files at "/static", without routes. This is so that
  // we can point the CDN at this folder and have it mirror ONLY the static
  // files, no other site content.
  self.app.use('/cdn', function (req, res, next) {
    static(req, res, function (err) {
      if (err) return next(err)
      out(req, res, function (err) {
        if (err) return next(err)
        nodeModules(req, res, function (err) {
          if (err) return next(err)
          lib(req, res, function (err) {
            if (err) return next(err)
            // If this next() function gets called, the file does not exist, so
            // return 404, and don't proceed to further middlewares/routes.
            res.send(404)
          })
        })
      })
    })
  })
}

Site.prototype.setupSessions = function () {
  var self = this

  self.app.use(cookieParser(secret.cookieSecret))
  self.app.use(bodyParser())

  var MongoStore = connectMongo(session)
  self.app.use(session({
    proxy: true, // trust the reverse proxy
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
}

/**
 * Make certain variables available to templates on this request.
 */
Site.prototype.addTemplateLocals = function (req, res, next) {
  res.locals.req = req
  res.locals.csrf = req.csrfToken()
  next()
}

if (!module.parent) util.run(Site)
