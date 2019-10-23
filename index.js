module.exports = Site

var bodyParser = require('body-parser')
var cluster = require('cluster')
var compression = require('compression')
var connectMongo = require('connect-mongo')
var connectSlashes = require('connect-slashes')
var cookieParser = require('cookie-parser')
var csrf = require('csurf')
var debug = require('debug')('studynotes:site')
var express = require('express')
var favicon = require('serve-favicon')
var flash = require('connect-flash')
var http = require('http')
var pug = require('pug')
var moment = require('moment')
var nib = require('nib')
var parallel = require('run-parallel')
var passport = require('passport')
var path = require('path')
var session = require('express-session')
var stylus = require('stylus')
var supportsColor = require('supports-color')
var url = require('url')
var useragent = require('useragent')

var auth = require('./lib/auth')
var config = require('./config')
var model = require('./model')
var pro = require('./lib/pro')
var routes = require('./routes')
var run = require('./run')
var secret = require('./secret')
var util = require('./util')

pug.filters.style = function (str) {
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
  if (!(self instanceof Site)) return new Site(opts, done)

  self.port = opts.port || config.ports.site

  self.id = cluster.isMaster ? 'master' : 'worker ' + cluster.worker.id
  self.debug('started')

  if (cluster.isMaster) {
    cluster.setupMaster({ exec: __filename })
    self.debug('Master process will spawn %d workers', config.numCpus)

    var workers = []
    for (var i = 0; i < config.numCpus; i++) {
      var worker = cluster.fork()
      workers.push(worker)
    }
    cluster.on('exit', function (worker, code) {
      // Force exit on worker exception; rely on supervisor to restart
      console.error('Worker ' + worker.id + ' exited (with code ' + code + '). Killing master process and all workers.')
      workers.forEach(function () {
        worker.kill()
      })
      process.exit(1)
    })

    var remaining = config.numCpus
    cluster.on('listening', function (worker, address) {
      remaining -= 1
      if (remaining === 0) done(null)
    })
    return
  }

  // Also set up 'uncaughtException' listeners in the workers
  // util.registerUncaughtException()

  self.app = express()
  self.server = http.createServer(self.app)

  // Trust "X-Forwarded-For" and "X-Forwarded-Proto" nginx headers
  self.app.enable('trust proxy')

  // Disable "powered by express" header
  self.app.disable('x-powered-by')

  // Use Pug for templates
  self.app.set('views', path.join(__dirname, 'views'))
  self.app.set('view engine', 'pug')
  self.app.engine('pug', pug.renderFile)

  // Make some variables and functions available to Pug templates
  self.app.locals.config = config
  self.app.locals.modelCache = model.cache
  self.app.locals.moment = moment
  self.app.locals.pretty = !config.isProd // minify html
  self.app.locals.util = util

  self.app.use(compression()) // gzip

  self.setupHeaders()
  self.setupStatic()

  self.app.use(connectSlashes()) // append trailing slash

  self.setupLogger()
  self.setupSessions()

  self.app.use(pro.checkPro)
  self.app.use(flash()) // errors are propogated using `req.flash`

  self.setupLocals()

  parallel([
    model.connect,
    function (cb) {
      // Start HTTP server -- workers will share TCP connection
      self.server.listen(self.port, cb)
    }
  ], function (err) {
    if (err) return done(err)
    routes(self.app)
    self.debug('listening on ' + self.port)
    done(null)
  })
}

Site.prototype.setupHeaders = function () {
  var self = this
  self.app.use(function (req, res, next) {
    var extname = path.extname(url.parse(req.url).pathname) // eslint-disable-line node/no-deprecated-api

    // Add cross-domain header for fonts, required by spec, Firefox, and IE.
    if (['.eot', '.ttf', '.otf', '.woff', '.woff2'].indexOf(extname) >= 0) {
      res.header('Access-Control-Allow-Origin', '*')
    }

    // Prevents IE and Chrome from MIME-sniffing a response to reduce exposure to
    // drive-by download attacks when serving user uploaded content.
    res.header('X-Content-Type-Options', 'nosniff')

    // Prevent rendering of site within a frame
    res.header('X-Frame-Options', 'DENY')

    // Enable the XSS filter built into most recent web browsers. It's usually
    // enabled by default anyway, so role of this headers is to re-enable for this
    // particular website if it was disabled by the user.
    res.header('X-XSS-Protection', '1; mode=block')

    // Force IE to use latest rendering engine or Chrome Frame
    res.header('X-UA-Compatible', 'IE=Edge,chrome=1')

    if (config.isProd) {
      // Use HTTP Strict Transport Security
      // Lasts 1 year, incl. subdomains, allow browser preload list
      res.header(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )

      // Redirect to main site url, over https
      if (req.method === 'GET' &&
          (req.protocol !== 'https' || req.hostname !== 'www.apstudynotes.org')) {
        self.debug('Redirect to canonical url: %s', req.hostname + req.url)
        return res.redirect(301, config.siteOrigin + req.url)
      }
    }

    next()
  })
}

Site.prototype.setupStatic = function () {
  var self = this

  // Favicon middleware makes favicon requests fast
  self.app.use(favicon(path.join(config.root, 'static/favicon.ico')))

  // Serve static files
  var opts = { maxAge: config.maxAge }
  var stat = express.static(config.root + '/static', opts)

  self.app.use(stat)

  // Serve static, out (built), and vendor files
  var out = express.static(config.root + '/out', opts)
  var vendor = express.static(config.root + '/vendor', opts)

  self.app.use(stat)
  self.app.use(out)
  self.app.use(vendor)

  // HACK: Make CSS relative URLs work in development
  if (!config.isProd) {
    self.app.use(express.static(config.root + '/vendor/select2', opts))
    self.app.use('/font', express.static(config.root + '/vendor/fontello/font', opts))
  }
}

Site.prototype.setupLogger = function () {
  var self = this
  self.app.use(function (req, res, next) {
    // Log requests using the "debug" module so that the output is hidden by default.
    // Enable with DEBUG=* environment variable.
    self.debug(
      (supportsColor.stderr ? '\x1B[90m' : '') +
      req.method + ' ' + req.originalUrl + ' ' + req.ip +
      (supportsColor.stderr ? '\x1B[0m' : '')
    )
    next()
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
      url: 'mongodb://' +
        secret.mongo.host + ':' +
        secret.mongo.port + '/' +
        secret.mongo.database,
      useNewUrlParser: true
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

Site.prototype.setupLocals = function () {
  var self = this

  var mobileFamilies = [
    'amazon-silk',
    'android',
    'blackberry-webkit',
    'chrome-mobile',
    'ie-mobile',
    'mobile-safari',
    'nokia-browser'
  ]

  var adBlock = [
    '136.24.8.53',
    '136.24.8.157',
    '67.161.169.40',
    '73.151.205.54'
  ]

  // Never show ads on urls that start with the following patterns
  var ignoreUrls = [
    '/about/',
    '/advertise/',
    '/contact/',
    '/essay-review/',
    '/login/',
    '/open-source/',
    '/photo-credits/',
    '/plagiarism/',
    '/privacy/',
    '/pro/',
    '/signup/',
    '/stats/',
    '/terms/',
    '/testimonials/'
  ]

  self.app.use(function (req, res, next) {
    var agent = useragent.lookup(req.headers['user-agent'])
    req.agent = agent.family.replace(/ /g, '-').toLowerCase()

    if (mobileFamilies.indexOf(req.agent) >= 0) {
      req.agent += ' mobile'
      req.mobile = true
    }

    res.locals.req = req
    res.locals.csrf = req.csrfToken()

    var isIgnoreUrl = ignoreUrls.some(ignoreUrl => req.url.startsWith(ignoreUrl))
    res.locals.ads = Boolean(req.query.ads) ||
      (adBlock.indexOf(req.ip) === -1 && !isIgnoreUrl)

    next()
  })
}

Site.prototype.debug = function () {
  var self = this
  var args = [].slice.call(arguments)
  args[0] = '[' + self.id + '] ' + args[0]
  debug.apply(null, args)
}

if (!module.parent) run(Site)
