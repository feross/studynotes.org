var config = require('../config')
var passport = require('passport')
var url = require('url')

module.exports =  function () {
  app.get('/login', function (req, res) {
    if (req.user) {
      var uri = url.parse(req.url)
      var origin = uri.protocol + '//' + uri.host
      if (req.cookies.next && origin === config.siteOrigin) {
        // Only redirect to our own domain, so we're not an "open redirector"
        res.redirect(req.cookies.next)
      } else {
        res.redirect('/')
      }
    } else {
      res.render('login', { errors: req.flash('error') })
    }
  })

  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    successRedirect: '/',
    failureFlash: true
  }))

  app.post('/logout', function (req, res) {
    req.logout()
    res.redirect('/')
  })

  // TODO
  app.get('/login/forgot', function (req, res) {
    res.send('TODO -- this feature is not ready yet. Email feross@studynotes.org.')
  })
  // app.post('/login/forgot', function (req, res) {
  // })
}
