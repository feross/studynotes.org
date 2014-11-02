var bytes = require('bytes')
var config = require('./config')
var cp = require('child_process')
var crypto = require('crypto')
var debug = require('debug')('util')
var email = require('./lib/email')
var express = require('express')
var fs = require('fs')
var htmlParser = require('html-parser')
var truncate = require('html-truncate')
var mkdirp = require('mkdirp')
var nodeUtil = require('util')
var once = require('once')
var optimist = require('optimist')
var os = require('os')
var path = require('path')
var posix = require('posix')
var touch = require('touch')
var util = require('./util') // to access the node+browser util fns
var uuid = require('node-uuid')

/**
 * Truncate plaintext or HTML.
 * @type {function(String, Number): String}
 */
exports.truncate = truncate

/**
 * Run the given server, passing in command line options as options.
 * @param  {function(*)} ServerConstructor
 */
exports.run = function (ServerConstructor) {
  // Clone the argv object to avoid interfering with other modules
  var opts = util.extend({}, optimist.argv)

  // Delete all options that are not explicitly passed in like this:
  //   node tracker --port 4000 --dbPort 4001
  delete opts.$0
  delete opts._

  // When server is started as "root" we can upgrade resource limits
  if (config.isProd && process.getuid() === 0) {

    // Upgrade resource limits
    posix.setrlimit('nofile', { soft: 10000, hard: 10000 })
    var limits = posix.getrlimit('nofile')
    console.log('Upgraded resource limit to ' + limits.soft)

    // Downgrade server from "root" user for security
    var oldUid = process.getuid()
    try {
      process.setuid('feross')
      console.log('Set uid to ' + process.getuid() + ' (previously ' + oldUid + ')')
    } catch (e) {
      throw new Error('Failed to downgrade uid ' + e)
    }
  }

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

/**
 * Generates a random UUID.
 * @return {string}
 */
exports.uuid = function () {
  return uuid.v1()
}

/**
 * Recursively and synchronously delete a folder and all its subfolders.
 * If the folder does not exist, then do nothing.
 *
 * @param {string} folderPath
 * @param {function(Error)=} cb
 */
exports.rmdirRecursive = function (dirPath, cb) {
  cb || (cb = function () {})

  // Verify that folder exists
  fs.readdir(dirPath, function (err) {
    if (err) {
      // Not an error if folder does not exist
      cb(null)
    } else {
      // Ensure that directory ends in a trailing slash
      if (dirPath[dirPath.length - 1] !== '/') {
        dirPath += '/'
      }
      // Remove the directory
      cp.exec('rm -r ' + dirPath, cb)
    }
  })
}

/**
 * Express middleware that logs requests using the "debug" module so that the
 * output is hidden by default.
 *
 * @param  {function(*)} debug instance
 */
exports.expressLogger = function (debug) {
  return function(req, res, next) {
    var status = res.statusCode
    var len = parseInt(res.getHeader('Content-Length'), 10)
    var color = 32

    if (status >= 500) color = 31
    else if (status >= 400) color = 33
    else if (status >= 300) color = 36

    len = isNaN(len)
      ? ''
      : len = ' - ' + bytes(len)

    var str = '\x1B[90m' + req.method
      + ' ' + req.originalUrl + ' '
      + '\x1B[' + color + 'm' + res.statusCode
      + ' \x1B[90m'
      + len
      + '\x1B[0m'

    debug(str)
    next()
  }
}

/**
 * Manually trigger LiveReload to refresh the browser (during development)
 */
exports.triggerLiveReload = function () {
  mkdirp.sync(config.tmp)
  touch.sync(path.join(config.tmp, 'reload.txt'))
}

/**
 * Escape a string to be included in a regular expression.
 *
 * From https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Regular_Expressions
 *
 * @param  {String} str
 * @return {String}
 */

exports.escapeRegExp = function(str) {
  return str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1")
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

// Make `inherits` from node's "util" module available
exports.inherits = nodeUtil.inherits
