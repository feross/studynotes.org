var config = require('../config')
var debug = require('debug')('studynotes:ssl')
var url = require('url')

/**
 * Middleware to ensure that a route is loaded over SSL. If it is not SSL,
 * then redirect to the SSL url.
 */
exports.ensureSSL = function (req, res, next) {
  if (req.protocol === 'https')
    return next()

  var newUrl = config.secureOrigin + req.url
  debug('Redirecting to ' + newUrl)

  if (config.isProd) {
    if (req.method !== 'GET')
      console.error('WARNING: Non-GET data sent in plaintext:' + req.url)
    res.redirect(newUrl)
  } else {
    debug('Skipping SSL redirect (dev)')
    next()
  }
}