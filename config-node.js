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
 * a referrer from an external site.
 * @type {Number}
 */
exports.numFree = 2

/**
 * Price of pro subscription (in cents!)
 * @type {Number}
 */
exports.proPrice = 1400

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

var MD5_JS
var MD5_CSS
if (config.isProd) {
  MD5_JS = fs.readFileSync(exports.out + '/MD5_JS', 'utf8')
  MD5_CSS = fs.readFileSync(exports.out + '/MD5_CSS', 'utf8')
}

/**
 * Final paths for JS and CSS files. Uniquely named using the MD5 hash of the
 * file contents, for cache busting.
 */
exports.jsPath = '/main' + (MD5_JS ? '-' + MD5_JS : '') + '.js'
exports.cssPath = '/main' + (MD5_CSS ? '-' + MD5_CSS : '') + '.css'

if (config.isProd) {
  exports.inline = {
    css: fs.readFileSync(exports.out + exports.cssPath, 'utf8'),
    heroBodyMask: 'data:image/png;base64,' + fs.readFileSync(exports.root + '/static/images/hero-body-mask.png', 'base64')
  }
}
