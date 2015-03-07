var config = require('../config')
var debug = require('debug')('studynotes:ssl')

/**
 * Middleware to ensure that a route is loaded over SSL. If it is not SSL,
 * then redirect to the SSL url.
 */
exports.ensureSSL = function (req, res, next) {
  if (req.protocol === 'https') return next()

  var newUrl = config.secureSiteOrigin + req.url
  debug('Redirecting to ' + newUrl)

  if (config.isProd) {
    if (req.method === 'GET') {
      res.redirect(newUrl)
    } else {
      console.error('WARNING: Non-GET data sent in plaintext:' + req.url)
    }
  } else {
    debug('Skipping SSL redirect (dev)')
    next()
  }
}
