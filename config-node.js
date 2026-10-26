const config = require('./config')
const fs = require('fs')
const path = require('path')

/**
 * Paths to different folders in this project. Used everywhere, so define them
 * once here.
 * @type {String}
 */
exports.root = __dirname
exports.out = path.join(exports.root, 'out')

/**
 * Maximum time to cache static resources (in milliseconds). This value is
 * sent in the HTTP cache-control header.
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

let MD5_JS
let MD5_CSS
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
exports.emailFooter = 'WebTorrent LLC, 548 Market St., Suite 97248, San Francisco, CA 94104'

if (config.isProd) {
  exports.inline = {
    css: fs.readFileSync(exports.out + exports.cssPath, 'utf8'),
    heroBodyMask: 'data:image/png;base64,' + fs.readFileSync(exports.root + '/static/images/hero-body-mask.png', 'base64')
  }
}
