/*jslint node: true */
"use strict";

module.exports = Site

var secret = require('./secret')

var _ = require('underscore')
var async = require('async')
var auth = require('./lib/auth')
var bcrypt = require('bcrypt')
var builder = require('./lib/builder')
var cluster = require('cluster')
var cp = require('child_process')
var config = require('./config')
var connectSlashes = require('connect-slashes')
var debug = require('debug')('studynotes:index')
var express = require('express')
var flash = require('connect-flash')
var fs = require('fs')
var http = require('http')
var model = require('./model')
var moment = require('moment')
var mongoose = require('mongoose')
var MongoStore = require('connect-mongo')(express)
var passport = require('passport')
var path = require('path')
var url = require('url')
var util = require('./util')

function Site (opts, cb) {
  var self = this
  if (opts) util.extend(self, opts)

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
    cluster.setupMaster({
      exec: __filename
    })

    builder.build(function (err, output) {
      if (err) return done(err)

      debug('Spawning ' + config.numCpus + ' workers')
      for (var i = 0; i < config.numCpus; i++) {
        cluster.fork({
          'CSS_MD5': output.cssMd5,
          'JS_MD5': output.jsMd5
        })
      }
      cluster.on('exit', function (worker, code, signal) {
        console.error('Worker %s died (%s)', worker.process.pid, code)
      })
      done(null)
    })
  } else {
    console.log('Worker %s started', cluster.worker.id)
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
    self.app.use(express.compress())
    self.app.use(self.addHeaders)
    if (config.isProd) self.app.use(self.canonicalize)

    self.serveStatic()
    self.app.use(connectSlashes())

    self.setupSessions()

    // Errors are propogated using `req.flash`
    self.app.use(flash())

    self.app.use(self.addTemplateLocals)

    require('./routes')(self.app)

    async.series([
      model.connect,
      function (cb) {
        // Start HTTP server -- workers will share TCP connection
        self.server.listen(self.port, cb)
      }
    ], function (err) {
      if (!err) {
        debug('StudyNotes listening on ' + self.port)
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

  self.app.locals._ = _
  self.app.locals.config = config
  self.app.locals.modelCache = model.cache
  self.app.locals.moment = moment
  self.app.locals.pretty = true
  self.app.locals.offline = self.offline
  self.app.locals.util = util

  self.app.locals.CSS_MD5 = process.env.CSS_MD5
  self.app.locals.JS_MD5 = process.env.JS_MD5
}

Site.prototype.addHeaders = function (req, res, next) {
  var extname = path.extname(url.parse(req.url).pathname)

  // Add cross-domain header for fonts, required by spec, Firefox, and IE.
  if (['.eot', '.ttf', '.otf', '.woff'].indexOf(extname) >= 0) {
    res.header('Access-Control-Allow-Origin', '*')
  }

  // Enforces secure (HTTP over SSL/TLS) connections to the server. This reduces
  // impact of bugs leaking session data through cookies and external links.
  // TODO: enable once we support HTTPS
  // res.header('Strict-Transport-Security', 'max-age=500')

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
  if (req.host !== 'www.apstudynotes.org') {
    // redirect alternate domains to homepage
    res.redirect(301, config.siteOrigin)
  } else if (req.protocol !== 'http') {
    // redirect HTTP to HTTPS
    res.redirect(301, config.siteOrigin + req.url)
  } else {
    next()
  }
}

Site.prototype.serveStatic = function () {
  var self = this

  // Favicon middleware makes favicon requests fast
  self.app.use(express.favicon(path.join(config.root, 'static/favicon.ico')))

  var staticMiddleware = express.static(path.join(config.root, 'out'), {
    maxAge: config.maxAge
  })

  // Serve static files, they take precedence over the routes.
  self.app.use(staticMiddleware)

  // Also mount the static files at "/static", without routes. This is so that
  // we can point the CDN at this folder and have it mirror ONLY the static
  // files, no other site content.
  self.app.use('/out', function (req, res, next) {
    staticMiddleware(req, res, function (err) {
      // If this next() function gets called, the file does not exist, so return
      // 404, and don't proceed to further middlewares/routes.
      if (err) return next(err)
      res.send(404)
    })
  })
}

Site.prototype.setupSessions = function () {
  var self = this

  self.app.use(express.cookieParser(secret.cookieSecret))
  self.app.use(express.bodyParser())
  self.app.use(express.session({
    proxy: true, // trust the reverse proxy
    secret: secret.cookieSecret, // prevent cookie tampering
    store: new MongoStore({
      db: config.mongo.database,
      host: config.mongo.host,
      port: config.mongo.port,
      auto_reconnect: true
    })
  }))
  self.app.use(express.csrf())

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
  res.locals.currentUser = req.user
  res.locals.csrf = req.csrfToken()
  next()
}

if (!module.parent) util.run(Site)