module.exports = Site

var _ = require('underscore')
var async = require('async')
var bcrypt = require('bcrypt')
var builder = require('./builder')
var cluster = require('cluster')
var config = require('./config')
var connectSlashes = require('connect-slashes')
var debug = global.debug = require('debug')('studynotes')
var express = require('express')
var expressValidator = require('express-validator')
var flash = require('connect-flash')
var fs = require('fs')
var http = require('http')
var model = require('./model')
var moment = require('moment')
var mongoose = require('mongoose')
var MongoStore = require('connect-mongo')(express)
var passport = require('passport')
var passportLocal = require('passport-local')
var path = require('path')
var secret = require('./secret')
var util = require('./util')

function Site (opts, cb) {
  var self = this
  /** @type {number} port */ opts.port || (opts.port = config.port)

  util.extend(self, opts)
  self.start(cb)
}

Site.prototype.start = function (done) {
  var self = this
  done || (done = function () {})

  if (cluster.isMaster) {
    builder.build(function (err, output) {
      if (!err) {
        debug('Spawning ' + config.numCluster + ' worker processes')
        _.times(config.numCluster, function () {
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

    global.app = express()
    self.server = http.createServer(app)

    // Readable logs that are hidden by default. Enable with DEBUG=*
    app.use(util.expressLogger(debug))

    // Trust the X-Forwarded-* headers from nginx
    app.enable('trust proxy')

    // Disable express advertising header
    app.disable('x-powered-by')

    // Gzip
    app.use(express.compress())

    // Jade for templating
    app.set('views', path.join(__dirname, 'views'))
    app.set('view engine', 'jade')

    app.use(self.addHeaders)

    if (config.isProd) {
      app.use(self.canonicalize)

    } else {
      // Pretty HTML
      app.locals.pretty = true

      // Serve static resources (nginx handles it in prod)
      app.use(express.static(path.join(config.root, 'static')))
    }
    // TODO: use MaxCDN and remove this
    app.use('/bower_components', express.static(path.join(config.root, 'bower_components')))

    app.use(connectSlashes())

    // Make variables and functions available to Jade templates
    app.locals._ = _
    app.locals.config = config
    app.locals.moment = moment
    app.locals.util = util

    app.locals.CSS_MD5 = process.env['CSS_MD5']
    app.locals.JS_MD5 = process.env['JS_MD5']

    app.use(express.favicon(path.join(config.root, 'static/favicon.ico')))
    app.use(expressValidator()) // validate user input

    app.use(express.cookieParser(secret.cookieSecret))
    app.use(express.bodyParser())
    app.use(express.session({
      proxy: true, // trust the reverse proxy
      secret: secret.cookieSecret, // prevent cookie tampering
      store: new MongoStore({
        db: config.mongo.database,
        host: config.mongo.host,
        port: config.mongo.port
      })
    }))

    // Passport
    app.use(passport.initialize())
    app.use(passport.session())

    passport.serializeUser(self.serializeUser)
    passport.deserializeUser(self.deserializeUser)

    passport.use(new passportLocal.Strategy({
      usernameField: 'email',
      passwordField: 'password'
    }, self.passportStrategy))

    app.auth = function (req, res, next) {
      if (req.isAuthenticated()) {
        next()
      } else {
        res.cookie('next', req.url)
        res.redirect('/login')
      }
    }

    // errors are propogated using `req.flash`
    app.use(flash())
    app.use(self.addTemplateLocals)

    require('./routes')()

    async.series([
      model.connect,
      model.cacheCourses,
      function (cb) {
        // Start HTTP server -- workers will share TCP connection
        self.server.listen(self.port, cb)
      }
    ], function (err) {
      if (!err) debug('StudyNotes listening on ' + self.port)
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

Site.prototype.addTemplateLocals = function (req, res, next) {
  // Make user object available to all templates
  res.locals.user = req.user

  next()
}

Site.prototype.serializeUser = function (user, done) {
  process.nextTick(function () {
    done(null, user.email)
  })
}

Site.prototype.deserializeUser = function (email, done) {
  model.User
    .findOne({ email: email })
    .exec(done)
}

Site.prototype.passportStrategy = function (email, password, done) {
  model.User
    .findOne({ email: email })
    .exec(function (err, user) {
      if (err) {
        done(err)
      } else if (user === null) {
        done(null, false, { message: 'Username not found' })
      } else {
        user.verifyPassword(password, function (err, isMatch) {
          if (err) {
            done(err)
          } else if (isMatch) {
            done(null, user)
          } else {
            done(null, false, { message: 'Wrong password' })
          }
        })
      }
    })
}

if (require.main === module) {
  util.run(Site)
}