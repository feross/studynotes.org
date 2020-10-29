module.exports = Site

const bodyParser = require('body-parser')
const compression = require('compression')
const connectMongo = require('connect-mongo')
const connectSlashes = require('connect-slashes')
const cookieParser = require('cookie-parser')
const csrf = require('csurf')
const debug = require('debug')('studynotes:site')
const express = require('express')
const favicon = require('serve-favicon')
const flash = require('connect-flash')
const http = require('http')
const pug = require('pug')
const moment = require('moment')
const nib = require('nib')
const parallel = require('run-parallel')
const passport = require('passport')
const path = require('path')
const session = require('express-session')
const stylus = require('stylus')
const supportsColor = require('supports-color')
const url = require('url')
const useragent = require('useragent')

const auth = require('./lib/auth')
const config = require('./config')
const model = require('./model')
const pro = require('./lib/pro')
const routes = require('./routes')
const run = require('./run')
const secret = require('./secret')
const util = require('./util')

pug.filters.style = function (str) {
  let ret
  stylus(str, { compress: config.isProd })
    .use(nib())
    .render(function (err, css) { // sync
      if (err) throw err
      ret = css
    })
  return '<style>' + ret + '</style>'
}

function Site (opts, done) {
  const self = this
  if (!(self instanceof Site)) return new Site(opts, done)

  self.port = opts.port || 4000

  self.debug('started')

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
  self.setupLocals()
  self.setupSessions()

  self.app.use(pro.checkPro)
  self.app.use(flash()) // errors are propogated using `req.flash`

  parallel([
    model.connect,
    function (cb) {
      self.server.listen(self.port, '127.0.0.1', cb)
    }
  ], function (err) {
    if (err) return done(err)
    routes(self.app)
    self.debug('listening on ' + self.port)
    done(null)
  })
}

Site.prototype.setupHeaders = function () {
  const self = this
  self.app.use(function (req, res, next) {
    const extname = path.extname(url.parse(req.url).pathname) // eslint-disable-line node/no-deprecated-api

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
  const self = this

  // Favicon middleware makes favicon requests fast
  self.app.use(favicon(path.join(config.root, 'static/favicon.ico')))

  // Serve static files
  const opts = {
    maxAge: config.maxAge
  }
  const stat = express.static(config.root + '/static', opts)
  const out = express.static(config.root + '/out', opts)
  const vendor = express.static(config.root + '/vendor', opts)

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
  const self = this
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
  const self = this

  self.app.use(cookieParser(secret.cookieSecret))

  // parse application/x-www-form-urlencoded
  self.app.use(bodyParser.urlencoded({ extended: false }))

  // parse application/json
  self.app.use(bodyParser.json())

  const MongoStore = connectMongo(session)
  self.app.use(session({
    proxy: true, // trust the reverse proxy
    resave: false, // don't save if session is unmodified
    saveUninitialized: false, // don't save new/unmodified sessions
    secret: secret.cookieSecret, // prevent cookie tampering
    store: new MongoStore({
      url: 'mongodb://' +
        secret.mongo.host + ':' +
        secret.mongo.port + '/' +
        secret.mongo.database
    })
  }))
  self.app.use(csrf())
  self.app.use(function (req, res, next) {
    res.locals.csrf = req.csrfToken()
    next()
  })

  // Passport
  self.app.use(passport.initialize())
  self.app.use(passport.session())
  passport.serializeUser(auth.serializeUser)
  passport.deserializeUser(auth.deserializeUser)
  passport.use(auth.passportStrategy)
}

Site.prototype.setupLocals = function () {
  const self = this

  const mobileFamilies = [
    'amazon-silk',
    'android',
    'blackberry-webkit',
    'chrome-mobile',
    'ie-mobile',
    'mobile-safari',
    'nokia-browser'
  ]

  const adBlock = [
    '136.24.8.53',
    '136.24.8.157',
    '67.161.169.40',
    '73.151.205.54'
  ]

  // Never show ads on urls that start with the following patterns
  const ignoreUrls = [
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
    const agent = useragent.lookup(req.headers['user-agent'])
    req.agent = agent.family.replace(/ /g, '-').toLowerCase()

    if (mobileFamilies.indexOf(req.agent) >= 0) {
      req.agent += ' mobile'
      req.mobile = true
    }

    res.locals.req = req

    const isIgnoreUrl = ignoreUrls.some(ignoreUrl => req.url.startsWith(ignoreUrl))
    res.locals.ads = Boolean(req.query.ads) ||
      (adBlock.indexOf(req.ip) === -1 && !isIgnoreUrl)

    next()
  })
}

Site.prototype.debug = function () {
  const args = [].slice.call(arguments)
  debug.apply(null, args)
}

if (!module.parent) run(Site)
