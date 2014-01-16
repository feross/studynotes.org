var config = require('./config')
var fs = require('fs')
var os = require('os')
var path = require('path')

/**
 * Paths to different folders in this project. Used everywhere, so define them
 * once here.
 * @type {String}
 */
exports.root = __dirname
exports.tmp = path.join(exports.root, 'tmp')
exports.out = path.join(exports.root, 'out')

/**
 * Number of "first click, free" essays that a given session can view before
 * requesting that they subscribe. The user can always view if they have
 * "google" in their referer.
 * @type {Number}
 */
exports.numFree = 2

/**
 * Number of cores on this CPU
 * @type {Number}
 */
exports.numCpus = config.isProd
  ? os.cpus().length
  : 1

/**
 * Maximum time to cache static resources (in milliseconds). This value is
 * sent in the HTTP cache-control header. MaxCDN will obey it, caching
 * the file for this length of time as well as passing it along to clients.
 *
 * @type {number}
 */
exports.maxAge = config.isProd
  ? 7 * 24 * 3600000 // 7 days
  : 0

/**
 * Maximum number of characters in a note/essay slug.
 * @type {Number}
 */
exports.maxSlugLength = 40

/**
 * MongoDB is web scale! (actually, web fail)
 * @type {Object}
 */
exports.mongo = {
  host: config.isProd
    ? 'athena.feross.net'
    : 'localhost',
  port: '27017',
  database: 'studynotes'
}

var MD5_JS_MAIN
var MD5_JS_EXTRA
var MD5_CSS
try {
  if (config.isProd) {
    MD5_JS_MAIN = fs.readFileSync(exports.out + '/MD5_JS_MAIN').toString()
    MD5_JS_EXTRA = fs.readFileSync(exports.out + '/MD5_JS_EXTRA').toString()
    MD5_CSS = fs.readFileSync(exports.out + '/MD5_CSS').toString()
  }
} catch (e) {}

/**
 * Final paths for JS and CSS files. Uniquely named using the MD5 hash of the
 * file contents, for cache busting.
 */
exports.jsMainPath = '/main' + (MD5_JS_MAIN ? '-' + MD5_JS_MAIN : '') + '.js'
exports.jsExtraPath = '/extra' + (MD5_JS_EXTRA ? '-' + MD5_JS_EXTRA : '') + '.js'
exports.cssPath = '/main' + (MD5_CSS ? '-' + MD5_CSS : '') + '.css'

