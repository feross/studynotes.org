var auth = require('../auth')
var config = require('../config')
var passport = require('passport')
var url = require('url')

module.exports =  function () {
  app.get('/login', auth.returnTo, function (req, res) {
    if (req.user) {
      res.redirect('/')
    } else {
      res.render('login', { errors: req.flash('error') })
    }
  })

  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login/',
    successReturnToOrRedirect: '/',
    failureFlash: 'Wrong email or password.'
  }))

  app.post('/logout', function (req, res) {
    req.logout()
    res.redirect('/')
  })

  // TODO
  app.get('/login/forgot', function (req, res) {
    res.send('TODO -- this feature is not ready yet. Email feross@studynotes.org if you forgot your password.')
  })
  // app.post('/login/forgot', function (req, res) {
  // })
}
