var passport = require('passport')

module.exports =  function () {
  app.get('/login', function (req, res) {
    if (req.user) {
      res.redirect('/')
    } else {
      var messages =
      res.render('login', { errors: req.flash('error') })
      debug(messages)
    }
  })

  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    successRedirect: '/dashboard',
    failureFlash: true
  }))

  app.post('/logout', function (req, res) {
    req.logout()
    res.redirect('/')
  })
}