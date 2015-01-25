var config = require('./config')
var crypto = require('crypto')
var debug = require('debug')('util')
var email = require('./lib/email')
var extend = require('extend.js')
var htmlParser = require('html-parser')
var optimist = require('optimist')
var posix = require('posix')

exports.truncate = require('html-truncate')

/**
 * Run the given server, passing in command line options as options.
 * @param  {function(*)} ServerConstructor
 */
exports.run = function (ServerConstructor) {
  // Clone the argv object to avoid interfering with other modules
  var opts = extend({}, optimist.argv)

  // Delete all options that are not explicitly passed in like this:
  //   node tracker --port 4000 --dbPort 4001
  delete opts.$0
  delete opts._

  upgradeLimits()
  downgradeUid()

  // Create and start the server
  var server = new ServerConstructor(opts, function (err) {
    if (err) {
      console.error('Error during ' + server.serverName + ' startup. Abort.')
      console.error(err.stack)
      process.exit(1)
    }
  })

  process.on('uncaughtException', function (err) {
    console.error('\nUNCAUGHT EXCEPTION')
    console.error(err.stack)
    email.notifyOnException({ err: err })
  })
}

var MAX_SOCKETS = 10000

function downgradeUid () {
  if (process.platform === 'linux' && config.isProd) {
    process.setgid('www-data')
    process.setuid('www-data')
    debug('downgraded gid (' + process.getgid() + ') uid (' + process.getuid() + ')')
  }
}

function upgradeLimits () {
  posix.setrlimit('nofile', { soft: MAX_SOCKETS, hard: MAX_SOCKETS })
  var limits = posix.getrlimit('nofile')
  debug('upgraded resource limits to ' + limits.soft)
}

/**
/**
 * Express middleware that logs requests using the "debug" module so that the
 * output is hidden by default.
 *
 * @param  {function(*)} debug instance
 */
exports.expressLogger = function (debug) {
  return function (req, res, next) {
    var str = '\x1B[90m' + req.method + ' ' + req.originalUrl + '\x1B[0m'
    debug(str)
    next()
  }
}

/**
 * Escape a string to be included in a regular expression.
 *
 * From https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Regular_Expressions
 *
 * @param  {String} str
 * @return {String}
 */

exports.escapeRegExp = function (str) {
  return str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1')
}

exports.hitsPerDay = function (hits, date) {
  var days = (Date.now() - new Date(date)) / 86400000
  days = Math.max(days, 0.00001) // To prevent divide by zero
  return Math.round(hits / days)
}

var defaultElementsWhitelist = [
  'p', 'br',
  'strong', 'b', 'em', 'i', 'u',
  'ol', 'ul', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'div', 'span',
  'sub', 'sup'
]

var defaultAttributesWhitelist = [

]

/**
 * Sanitize dirty (user-provided) HTML to remove bad html tags. Uses a
 * whitelist approach, where only the tags we explicitly allow are kept.
 *
 * @param  {String} html                dirty HTML
 * @param  {Array=} elementsWhitelist   elements to keep
 * @param  {Array=} attributesWhitelist attributes to keep
 * @return {String}                     sanitized HTML
 */
exports.sanitizeHTML = function (html, elementsWhitelist, attributesWhitelist) {
  elementsWhitelist || (elementsWhitelist = defaultElementsWhitelist)
  attributesWhitelist || (attributesWhitelist = defaultAttributesWhitelist)

  var sanitized = htmlParser.sanitize(html, {
    elements: function (name) {
      return elementsWhitelist.indexOf(name) === -1
    },
    attributes: function (name) {
      return attributesWhitelist.indexOf(name) === -1
    },
    comments: true,
    doctype: true
  })
  return sanitized
}

exports.randomBytes = function (length, cb) {
  if (typeof length === 'function') {
    cb = length
    length = 20
  }
  if (!cb) throw new Error('argument cb required')

  crypto.randomBytes(length, function (err, buf) {
    if (err) return cb(err)
    cb(null, buf.toString('hex'))
  })
}
