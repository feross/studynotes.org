var auth = require('../lib/auth')
var config = require('../config')
var passport = require('passport')
var ssl = require('../lib/ssl')
var url = require('url')

module.exports = function (app) {
  app.get('/login', ssl.ensureSSL, auth.returnTo, function (req, res) {
    if (req.user) {
      res.redirect(req.session.returnTo || '/')
    } else {
      res.render('login', {
        title: 'Login',
        url: '/login',
        // pre-fill for Pro users who haven't linked accounts yet
        email: req.session.pro && req.session.pro.email,
        errors: req.flash('error')
      })
    }
  })

  app.post('/login', ssl.ensureSSL, passport.authenticate('local', {
    failureRedirect: '/login/',
    successReturnToOrRedirect: '/',
    failureFlash: 'Wrong email or password.',
    successFlash: 'You are logged in!'
  }))

  app.post('/logout', ssl.ensureSSL, function (req, res) {
    // Give Pro users their "first click, free" back when they logout
    if (req.isAuthenticated() && req.user.pro)
      delete req.session.free

    req.logout()
    res.send(200) // redirect happens on client-side
  })

  // TODO
  app.get('/login/forgot', ssl.ensureSSL, function (req, res) {
    res.send('TODO -- this feature is not ready yet. Email feross@studynotes.org if you forgot your password.')
  })
  // app.post('/login/forgot', function (req, res) {
  // })
}
