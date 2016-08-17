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
exports.out = path.join(exports.root, 'out')

var month = new Date().getMonth() + 1

/**
 * Number of "first click, free" essays that a given session can view before
 * requesting that they subscribe. The user can always view if they have
 * a referrer from an external site.
 * @type {Number}
 */
exports.numFree = month === 1 || month === 12
  ? 1 // Dec-Jan, 1 essay
  : month <= 9
    ? 3 // Feb-Sep, 3 essays
    : 2 // Oct-Nov, 2 essays

/**
 * Is it college essay season? Used to determine whether to show in-house ads for
 * essay editing services vs. third-party ads.
 */
exports.essaySeason = month >= 9 // September

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

/**
 * String to append to the end of all emails
 */
exports.emailFooter = 'Study Notes LLC, PO Box 19678, Stanford, CA 94305'

if (config.isProd) {
  exports.inline = {
    css: fs.readFileSync(exports.out + exports.cssPath, 'utf8'),
    heroBodyMask: 'data:image/png;base64,' + fs.readFileSync(exports.root + '/static/images/hero-body-mask.png', 'base64')
  }
}
