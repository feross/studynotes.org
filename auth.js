var config = require('./config')
var url = require('url')

/**
 * Middleware to process the `returnTo` query parameter and if it's safe, add
 * it to the session so that the user can be redirected there after they have
 * logged in or signed up.
 */
exports.returnTo = function (req, res, next) {
  if (!req.isAuthenticated() && req.query.returnTo) {
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

/**
 * Middleware to ensure that the user has logged in. If they're not, redirect to
 * the sign up page.
 */
exports.ensureAuth = function (req, res, next) {
  if (req.isAuthenticated()) {
    next()
  } else {
    debug('Redirecting because user is not logged in')
    res.redirect('/signup/?returnTo=' + req.url)
  }
}