/*jslint node: true */
"use strict";

module.exports = Site

var secret = require('./secret')

var _ = require('underscore')
var async = require('async')
var auth = require('./auth')
var bcrypt = require('bcrypt')
var builder = require('./builder')
var cluster = require('cluster')
var cp = require('child_process')
var config = require('./config')
var connectSlashes = require('connect-slashes')
var DB = require('./db')
var debug = require('debug')('studynotes:index')
var engine = require('engine.io')
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
  if (opts) util.extend(self, opts)

  /** @type {number} port */
  self.port || (self.port = config.ports.site)

  /** @type {boolean} offline mode? */
  self.offline || (self.offline = false)

  self.online = {}

  self.start(cb)
}

Site.prototype.start = function (done) {
  var self = this
  done || (done = function () {})

  if (cluster.isMaster) {
    async.auto({
      build: builder.build,
      deleteDb: function (cb) {
        var dbPath = path.join(config.root, 'db/store')
        cp.exec('rm -rf ' + dbPath, cb)
      },
      startDb: function (cb) {
        self.db = new DB({}, cb)
      }
    }, function (err, results) {
      if (err) return done(err)

      debug('Spawning ' + config.numCpus + ' workers.')
      for (var i = 0; i < config.numCpus; i++) {
        cluster.fork({
          'CSS_MD5': results.build.cssMd5,
          'JS_MD5': results.build.jsMd5
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
    self.setupEngine()

    // Trust the X-Forwarded-* headers from nginx
    self.app.enable('trust proxy')

    // Jade for templating
    self.app.set('views', path.join(__dirname, 'views'))
    self.app.set('view engine', 'jade')

    // Readable logs that are hidden by default. Enable with DEBUG=*
    self.app.use(util.expressLogger(debug))
    self.app.use(express.compress())
    self.app.use(self.addHeaders)

    if (config.isProd) {
      self.app.use(self.canonicalize)
    }

    self.serveStatic()
    self.app.use(connectSlashes())

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

    // Errors are propogated using `req.flash`
    self.app.use(flash())

    self.addTemplateGlobals()
    self.app.use(self.addTemplateLocals)

    require('./routes')(self.app)

    async.series([
      function (cb) {
        self.db = DB.connect(cb)
      },
      self.setupLiveStream.bind(self),
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

Site.prototype.serveStatic = function () {
  var self = this

  self.app.use(express.favicon(path.join(config.root, 'static/favicon.ico')))
  var staticMiddleware = express.static(path.join(config.root, 'static'), {
    maxAge: config.maxAge
  })
  self.app.use(staticMiddleware)
  self.app.use('/static', function (req, res, next) {
    staticMiddleware(req, res, function (err) {
      if (err) return next(err)
      res.send(404)
    })
  })
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

/**
 * Make certain variables available to templates on this request.
 */
Site.prototype.addTemplateLocals = function (req, res, next) {
  res.locals.currentUser = req.user
  res.locals.csrf = req.csrfToken()
  next()
}

Site.prototype.setupLiveStream = function (cb) {
  var self = this

  self.db.liveStream({
    min: 'online!',
    max: 'online!\xFF'
  }).on('data', function (record) {
    debug('Received liveStream update: ' + record.key)
    var exec = /^online!(.*)!/.exec(record.key)
    if (exec) {
      var pathname = exec[1]
      self.updateOnlineCount(pathname)
      self.updateOnlineCount('/')
    }
  })
  cb(null)
}

Site.prototype.getOnlineCount = function (pathname, cb) {
  var self = this

  if (pathname === '/') {
    // Show total users across site on homepage
    self.db.count({
      prefix: 'online!'
    }, cb)
  } else {
    self.db.count({
      prefix: 'online!' + pathname
    }, cb)
  }
}

Site.prototype.updateOnlineCount = function (pathname) {
  var self = this
  var sockets = self.online[pathname]

  // Early return if there are no updates to send
  if (!sockets || sockets.length === 0) return

  self.getOnlineCount(pathname, function (err, count) {
    if (err) return console.error(err.message)

    sockets.forEach(function (socket) {
      socket.send(JSON.stringify({ type: 'update', count: count }))
    })
  })
}

Site.prototype.setupEngine = function () {
  var self = this

  self.engine = engine.attach(self.server)
  self.engine.on('connection', function (socket) {
    socket.on('message', self.onSocketMessage.bind(self, socket))
    socket.on('close', self.onSocketClose.bind(self, socket))
  })
}

Site.prototype.onSocketMessage = function (socket, str) {
  var self = this
  var message
  try {
    debug('Received message: ' + str)
    message = JSON.parse(str)
  } catch (e) {
    debug('Discarding non-JSON message: ' + message)
    return
  }
  if (message.type === 'online') {
    // Only accept the first 'online' message
    if (socket.pathname) return

    var pathname = message.pathname.replace('!', '')
    socket.pathname = pathname

    if (!self.online[pathname]) self.online[pathname] = []
    self.online[pathname].push(socket)

    var key = 'online!' + pathname + '!' + socket.id
    self.db.put(key, true, function (err) {
      if (err) console.error(err)
    })
  }
}

Site.prototype.onSocketClose = function (socket) {
  var self = this
  var sockets = self.online[socket.pathname]

  var index = sockets.indexOf(socket)
  sockets.splice(index, 1)

  var key = 'online!' + socket.pathname + '!' + socket.id
  self.db.del(key, function (err) {
    if (err) console.error(err)
  })
}

if (!module.parent) util.run(Site)
