module.exports = Site

// var MailChimpAPI = require('mailchimp').MailChimpAPI
var _ = require('underscore')
var async = require('async')
var bcrypt = require('bcrypt')
var builder = require('./builder')
var cluster = require('cluster')
var config = require('./config')
var debug = global.debug = require('debug')('site')
var express = require('express')
var expressValidator = require('express-validator')
var flash = require('connect-flash')
var fs = require('fs')
var http = require('http')
var moment = require('moment')
var mongoose = require('mongoose')
var once = require('once')
var os = require('os')
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

    // Trust the X-Forwarded-* headers from the router
    app.enable('trust proxy')

    // Disable express advertising header
    app.disable('x-powered-by')

    // Gzip
    app.use(express.compress())

    // Jade for templating
    app.set('views', path.join(__dirname, 'views'))
    app.set('view engine', 'jade')

    if (config.isProd) {
      app.use(self.canonicalize)
      app.use(self.addSecurityHeaders)

    } else {
      // Pretty HTML
      app.locals.pretty = true
    }

    app.use(self.addHeaders)

    // Make variables and functions available to Jade templates
    app.locals._ = _
    app.locals.config = config
    app.locals.moment = moment
    app.locals.util = util

    app.locals.CSS_MD5 = process.env['CSS_MD5']
    app.locals.JS_MD5 = process.env['JS_MD5']

    app.use(expressValidator()) // validate user input

    app.use(express.cookieParser(secret.cookieSecret))
    app.use(express.bodyParser())
    app.use(express.session({
      secret: secret.cookieSecret, // prevent cookie tampering
      proxy: true // trust the reverse proxy
    }))

    // Passport
    app.use(passport.initialize())
    app.use(passport.session())

    passport.serializeUser(self.serializeUser)
    passport.deserializeUser(self.deserializeUser)

    passport.use(new passportLocal.Strategy(
      function (username, password, done) {
        self.db.get('user!' + username, function (err, user) {
          if (err && err.name === 'NotFoundError') {
            done(null, false, { message: 'Username not found' })
          } else if (err) {
            done(err)
          } else {
            bcrypt.compare(password, user.password, function (err, res) {
              if (res) {
                done(null, user)
              } else {
                done(null, false, { message: 'Wrong password' })
              }
            })
          }
        })
      }
    ))

    app.auth = function (req, res, next) {
      if (req.isAuthenticated()) {
        next()
      } else {
        res.redirect('/login')
      }
    }

    // errors are propogated using `req.flash`
    app.use(flash())

    require('./routes')()

    async.parallel([
      function (cb) {
        require('./models').connect(cb)
      },
      function (cb) {
        require('./models').warmCache(cb)
      },
      function (cb) {
        // Start HTTP server -- workers will all share a TCP connection
        self.server.listen(self.port, cb)
      }
    ], function (err) {
      if (!err) {
        debug('StudyNotes listening on ' + self.port)
      }
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

Site.prototype.addSecurityHeaders = function (req, res, next) {
  // Strict transport security (to prevent MITM attacks on the site)
  res.header('Strict-Transport-Security', 'max-age=500')

  // TODO: add more

  next()
}

Site.prototype.addHeaders = function (req, res, next) {
  // Opt into the future
  res.header('X-UA-Compatible', 'IE=Edge,chrome=1')

  next()
}

Site.prototype.serializeUser = function (user, done) {
  var self = this
  process.nextTick(function () {
    done(null, user._id)
  })
}

Site.prototype.deserializeUser = function (userId, done) {
  var self = this
  m.User
  .findOne({ _id: userId })
  .exec(done)
}

if (require.main === module) {
  util.run(Site)
}