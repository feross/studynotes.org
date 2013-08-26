module.exports = Site

// var MailChimpAPI = require('mailchimp').MailChimpAPI
var _ = require('underscore')
var async = require('async')
var bcrypt = require('bcrypt')
var builder = require('./builder')
var cluster = require('cluster')
var config = require('./config')
var debug = require('debug')('site')
var express = require('express')
var expressValidator = require('express-validator')
var flash = require('connect-flash')
var fs = require('fs')
var http = require('http')
var models = require('./models')
var moment = require('moment')
var mongoose = require('mongoose')
var once = require('once')
var os = require('os')
var passport = require('passport')
var passportLocal = require('passport-local')
var path = require('path')
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

    var app = self.app = express()
    self.server = http.createServer(app)

    // Readable logs that are hidden by default. Enable with DEBUG=*
    self.app.use(util.expressLogger(debug))

    // Trust the X-Forwarded-* headers from the router
    self.app.enable('trust proxy')

    // Disable express advertising header
    self.app.disable('x-powered-by')

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
    // app.use(passport.initialize())
    // app.use(passport.session())

    // // Setup passport
    // passport.serializeUser(function (user, done) {
    //   done(null, user.username)
    // })

    // passport.deserializeUser(function (username, done) {
    //   self.db.get('user!' + username, function (err, user) {
    //     if (err) {
    //       done(err)
    //     } else {
    //       done(null, user)
    //     }
    //   })
    // })

    // passport.use(new passportLocal.Strategy(
    //   function (username, password, done) {
    //     self.db.get('user!' + username, function (err, user) {
    //       if (err && err.name === 'NotFoundError') {
    //         done(null, false, { message: 'Username not found' })
    //       } else if (err) {
    //         done(err)
    //       } else {
    //         bcrypt.compare(password, user.password, function (err, res) {
    //           if (res) {
    //             done(null, user)
    //           } else {
    //             done(null, false, { message: 'Wrong password' })
    //           }
    //         })
    //       }
    //     })
    //   }
    // ))

    // app.auth = function (req, res, next) {
    //   if (req.isAuthenticated()) {
    //     next()
    //   } else {
    //     res.redirect('/login')
    //   }
    // }

    // // errors are propogated using `req.flash`
    // app.use(flash())

    // app.get('/login', function (req, res) {
    //   if (req.user) {
    //     res.redirect('/')
    //   } else {
    //     var messages = req.flash('error')
    //     res.render('login', {messages: messages})
    //     debug(messages)
    //   }
    // })

    // app.post('/login', passport.authenticate('local', {
    //   failureRedirect: '/login',
    //   successRedirect: '/dashboard',
    //   failureFlash: true
    // }))

    // app.post('/logout', function (req, res) {
    //   req.logout()
    //   res.redirect('/')
    // })

    // app.get('/signup', function (req, res) {
    //   if (req.user) {
    //     res.redirect('/')
    //   } else {
    //     res.render('signup', { messages: req.flash('error') })
    //   }
    // })

    // app.post('/signup', function (req, res, next) {
    //   req.assert('username', 'Not a valid email address').isEmail()
    //   req.assert('password', 'Password must be greater than 4 characters').len(4).notEmpty()

    //   var errors = req.validationErrors()
    //   if (errors) {
    //     errors.forEach(function (error) {
    //       req.flash('error', error.msg)
    //       debug('Registration error: ' + error.msg)
    //     })
    //     res.redirect('/signup')
    //     return
    //   }

    //   // TODO: validate and only store properties that we are expecting
    //   var username = req.body.username
    //   self.db.get('user!' + username, function (err) {
    //     if (err && err.name === 'NotFoundError') {
    //       // Hash the password and store it
    //       bcrypt.hash(req.body.password, 8, function (err, hash) {
    //         if (err) {
    //           req.flash('error', err.name + ': ' + err.message)
    //           debug('BCrypt Error: ' + err.message)
    //           res.redirect('/signup')
    //         } else {
    //           req.body.password = hash
    //           self.db.put('user!' + username, req.body, function (err) {
    //             if (err) {
    //               req.flash('error', err.name + ': ' + err.message)
    //               res.redirect('/signup')
    //             } else {
    //               // Automatically login the user upon registration
    //               req.login(req.body, function (err) {
    //                 if (err) { return next(err) }
    //                 return res.redirect('/onboard')
    //               })
    //             }
    //           })
    //         }
    //       })
    //     } else if (err) {
    //       req.flash('error', err.name + ': ' + err.message)
    //       debug('LevelDB Error: ' + err.message)
    //       res.redirect('/signup')
    //     } else {
    //       req.flash('error', 'Username is already registered.')
    //       debug('Username is already registered')
    //       res.redirect('/signup')
    //     }
    //   })

    // })

    // TODO: add users to Mailchimp
    // module.exports = function (app) {
    //   app.post('/subscribe', function (req, res) {
    //     try {
    //       var api = new MailChimpAPI(config.mailchimp.key, { version : '2.0' })
    //     } catch (e) {
    //       console.error(e)
    //     }

    //     var email = req.body.email

    //     api.call('lists', 'subscribe', {
    //       email: { email: email },
    //       id: config.mailchimp.listId
    //     }, function (err, data) {
    //       if (err) {
    //         console.error(err)
    //         res.send({ status: 'error' })
    //       } else {
    //         res.send({ status: 'ok' })
    //       }
    //     })
    //   })
    // }

    require('./routes')(app)

    async.parallel([
      self.connectDB.bind(self),
      function (cb) {
        models(app)
        models.warmCache(cb)
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

Site.prototype.connectDB = function (cb) {
  var self = this
  var app = self.app

  mongoose.set('debug', !config.isProd)
  app.db = mongoose.createConnection('mongodb://' +
    config.db.user + '@' + config.db.host + ':' +
    config.db.port + '/' + config.db.database, {
      server: { poolSize: 20 }
  })
  cb = once(cb)
  app.db.on('error', cb)
  app.db.on('open', function () {
    cb(null)
  })
}

if (require.main === module) {
  util.run(Site)
}