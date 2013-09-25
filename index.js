/*jslint node: true */
"use strict";

module.exports = Site

var secret = require('./secret')

// NodeTime
if (process.env.NODE_ENV === 'production') {
  require('nodetime').profile({
    accountKey: secret.nodetime.accountKey,
    appName: secret.nodetime.appName
  })
}

var _ = require('underscore')
var async = require('async')
var auth = require('./auth')
var bcrypt = require('bcrypt')
var builder = require('./builder')
var cluster = require('cluster')
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
var util = require('./util')

function Site (opts, cb) {
  var self = this
  /** @type {number} port */ opts.port || (opts.port = config.port)
  /** @type {boolean} offline mode? */ opts.offline || (opts.offline = false)

  util.extend(self, opts)
  self.start(cb)
}

Site.prototype.start = function (done) {
  var self = this
  done || (done = function () {})

  console.log(require('posix').getrlimit('nofile'))

  if (cluster.isMaster) {
    builder.build(function (err, output) {
      if (!err) {
        debug('Spawning ' + config.numCpus + ' worker processes')
        _.times(config.numCpus, function () {
          cluster.fork({
            'CSS_MD5': output.cssMd5,
            'JS_MD5': output.jsMd5
          })
        })
        cluster.on('exit', function (worker, code, signal) {
          console.error('Worker ' + worker.process.pid + ' died')
        })
      }
      done(err)
    })

  } else {
    var app = express()
    self.server = http.createServer(app)

    // Trust the X-Forwarded-* headers from nginx
    app.enable('trust proxy')

    // Jade for templating
    app.set('views', path.join(__dirname, 'views'))
    app.set('view engine', 'jade')

    // Readable logs that are hidden by default. Enable with DEBUG=*
    app.use(util.expressLogger(debug))

    // Gzip
    app.use(express.compress())

    app.use(self.addHeaders)

    if (config.isProd) {
      app.use(self.canonicalize)

    } else {
      // Pretty HTML
      app.locals.pretty = true

      // Serve static resources (nginx handles it in prod)
      app.use(express.favicon(path.join(config.root, 'static/favicon.ico')))
    }

    // Serve static files
    var staticMiddleware = express.static(path.join(config.root, 'static'), {
      maxAge: config.maxAge
    })
    app.use(staticMiddleware)
    app.use('/static', function (req, res, next) {
      staticMiddleware(req, res, function (err) {
        if (err) return next(err)
        res.send(404)
      })
    })


    app.use(connectSlashes())

    // Make variables and functions available to Jade templates
    app.locals._ = _
    app.locals.config = config
    app.locals.modelCache = model.cache
    app.locals.moment = moment
    app.locals.offline = self.offline
    app.locals.util = util

    app.locals.CSS_MD5 = process.env.CSS_MD5
    app.locals.JS_MD5 = process.env.JS_MD5

    app.use(express.cookieParser(secret.cookieSecret))
    app.use(express.bodyParser())
    app.use(express.session({
      proxy: true, // trust the reverse proxy
      secret: secret.cookieSecret, // prevent cookie tampering
      store: new MongoStore({
        db: config.mongo.database,
        host: config.mongo.host,
        port: config.mongo.port,
        auto_reconnect: true
      })
    }))
    app.use(express.csrf())

    // Passport
    app.use(passport.initialize())
    app.use(passport.session())
    passport.serializeUser(auth.serializeUser)
    passport.deserializeUser(auth.deserializeUser)
    passport.use(auth.passportStrategy)

    // Errors are propogated using `req.flash`
    app.use(flash())

    app.use(self.addTemplateLocals)

    require('./routes')(app)

    async.series([
      model.connect,
      model.loadCache,
      function (cb) {
        // Start HTTP server -- workers will share TCP connection
        self.server.listen(self.port, cb)
      }
    ], function (err) {
      if (!err) debug('StudyNotes listening on ' + self.port)
      util.triggerLiveReload()
      done(err)
    })
  }
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

Site.prototype.addHeaders = function (req, res, next) {
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

// Make certain variables available to templates on this request
Site.prototype.addTemplateLocals = function (req, res, next) {
  res.locals.currentUser = req.user
  res.locals.csrf = req.csrfToken()
  next()
}

if (!module.parent) util.run(Site)
