var extend = require('xtend/mutable')

/**
 * Is site running in production?
 * @type {Boolean}
 */
var isProd = exports.isProd = process.browser
  ? !/^local/.test(window.location.hostname)
  : process.env.NODE_ENV === 'production'

/**
 * Server listening ports
 * @type {Object}
 */
exports.ports = {
  site: isProd ? 7300 : 4000,
  liveupdater: isProd ? 7301 : 4001
}

/**
 * Website hostname
 * @type {string}
 */
exports.siteHost = isProd
  ? 'www.apstudynotes.org'
  : 'localhost:' + exports.ports.site

/**
 * Origin of the website
 * @type {string}
 */
exports.siteOrigin = (isProd ? 'https' : 'http') + '://' + exports.siteHost

/**
 * Origin of the CDN server
 * @type {[type]}
 */
exports.cdnOrigin = isProd
  ? 'https://cdn.apstudynotes.org'
  : exports.siteOrigin + '/cdn'

/**
 * Price of pro subscription (in cents!)
 * @type {Number}
 */
exports.proPrice = 1400

/**
 * Stripe publishable token
 * @type {string}
 */
exports.stripe = isProd
  ? 'pk_live_uQgfjT84EYgqyXWasBY0xuOE'
  : 'pk_test_7PVccMkybStuChGcJD0HAi40'

var config = require('./config-node')
extend(exports, config)
