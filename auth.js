var config = require('./config')
var url = require('url')

/**
 * Middleware to process the `returnTo` query parameter and if it's safe, add
 * it to the session so that the user can be redirected there after they have
 * logged in or signed up.
 */
exports.returnTo = function (req, res, next) {
  if (!req.user && req.query.returnTo) {
    // Convert relative URLs to absolute, with protocol and
    var uri = url.resolve(config.siteOrigin, req.query.returnTo)
    var parsedUri = url.parse(uri)
    var origin = parsedUri.protocol + '//' + parsedUri.host
    if (origin === config.siteOrigin) {
      // Only redirect to our own domain, so we're not an "open redirector"
      req.session.returnTo = req.query.returnTo
    }
  }
  next()
}