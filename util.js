var config = require('./config')
var cp = require('child_process')
var debug = require('debug')('util')
var express = require('express')
var fs = require('fs')
var mkdirp = require('mkdirp')
var nodeUtil = require('util')
var once = require('once')
var optimist = require('optimist')
var os = require('os')
var path = require('path')
var touch = require('touch')
var uuid = require('node-uuid')

/**
 * Copy all of the properties in the source objects over to the destination
 * object, and return the destination object. It's in-order, so the last
 * source will override properties of the same name in previous arguments.
 * @type {function(Object, ...[Object]): Object}
 */
exports.extend = function (dest /*, ... */) {
  var sources = Array.prototype.slice.call(arguments, 1)
  sources.forEach(function (source) {
    for (var prop in source) {
      if (source[prop] !== undefined) {
        dest[prop] = source[prop]
      }
    }
  })
  return dest
}

/**
 * Run the given server, passing in command line options as options.
 * @param  {function(*)} ServerConstructor
 */
exports.run = function (ServerConstructor) {
  // Clone the argv object to avoid interfering with other modules
  var opts = exports.extend({}, optimist.argv)

  // Delete all options that are not explicitly passed in like this:
  //   node tracker --port 4000 --dbPort 4001
  delete opts['$0']
  delete opts._

  // Create and start the server
  var server = new ServerConstructor(opts, function (err) {
    if (err) {
      console.error('Error during startup of server ' + server.serverName + '. Exiting process.')
      console.error(err.stack)
      process.exit(1)
    }
  })

  process.on('uncaughtException', function (err) {
    console.error('UNCAUGHT EXCEPTION')
    console.error(err.stack)
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
 * Add commas to an integer, so that it's easier to read.
 * @param {Integer} x The number
 * @return {String} The number with commas
 */

exports.addCommasToInteger = function (x) {
  x += '' // convert to String
  var rgx = /(\d+)(\d{3})/

  while (rgx.test(x)) {
    x = x.replace(rgx, '$1' + ',' + '$2')
  }
  return x
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

    var str = '\033[90m' + req.method
      + ' ' + req.originalUrl + ' '
      + '\033[' + color + 'm' + res.statusCode
      + ' \033[90m'
      + len
      + '\033[0m'

    debug(str)
    next()
  }
}

/**
 * Manually trigger LiveReload to refresh the browser (during development)
 */
exports.triggerLiveReload = function () {
  if (os.platform() === 'darwin' && !config.isProd) {
    mkdirp.sync(config.tmp)
    touch.sync(path.join(config.tmp, 'restart.txt'))
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

exports.escapeRegExp = function(str) {
  return str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1")
}

// Make `inherits` from node's "util" module available
exports.inherits = nodeUtil.inherits