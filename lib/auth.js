const config = require('../config')
const debug = require('debug')('studynotes:auth')
const model = require('../model')
const passportLocal = require('passport-local')
const url = require('url')

/**
 * Middleware to process the `returnTo` query parameter and if it's safe, add
 * it to the session so that the user can be redirected there after they have
 * logged in or signed up.
 */
exports.returnTo = function (req, res, next) {
  if (!req.isAuthenticated() && req.query.returnTo) {
    // Convert relative URLs to absolute
    const uri = url.resolve(config.siteOrigin, req.query.returnTo) // eslint-disable-line node/no-deprecated-api

    // Only redirect to our own domain, so we're not an "open redirector"
    if (url.parse(uri).host === config.siteHost) { // eslint-disable-line node/no-deprecated-api
      req.session.returnTo = uri
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
    res.redirect(config.siteOrigin + '/signup/?returnTo=' + req.url)
  }
}

/**
 * Passport serialize user function.
 */
exports.serializeUser = function (user, done) {
  process.nextTick(function () {
    done(null, user.email)
  })
}

/**
 * Passport deserialize user function.
 */
exports.deserializeUser = function (email, done) {
  model.User
    .findOne({ email: email })
    .select('-password')
    .exec(done)
}

/**
 * Passport authentication strategy. Tests if the user's credentials are correct
 * so they can log in.
 */
exports.passportStrategy = new passportLocal.Strategy({
  usernameField: 'email',
  passwordField: 'password'
}, function (email, password, done) {
  model.User
    .findOne({ emailLowerCase: email && email.toLowerCase() })
    .exec(function (err, user) {
      if (err) return done(err)
      if (user === null) {
        return done(null, false, { message: 'Username not found' })
      }

      user.comparePassword(password, function (err, isMatch) {
        if (err) return done(err)

        if (isMatch) done(null, user)
        else done(null, false, { message: 'Wrong password' })
      })
    })
})
