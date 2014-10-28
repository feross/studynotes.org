var auth = require('../lib/auth')
var config = require('../config')
var passport = require('passport')
var ssl = require('../lib/ssl')
var util = require('util')
var url = require('url')
var crypto = require('crypto')
var email = require('../lib/email')
var model = require('../model')

var FORT_NIGHT_MS = 14 * 24 * 60 * 60 * 1000

var composeResetMsg = function(params) {
  var from = params.from || '"Study Notes Admin" <admin@apstudynotes.org>'
  
  var html = util.format(
      'Hey %s,<br /><ul />We recently received a password reset from you.<br /><br />' +
      'Please click <a href="%s/login/resetPassword/%s">here</a> to reset it before: %s',
      params.name, params.mainURL, params.token, params.expiryDate)

  return {
    from: from, to: params.to,
    subject: "Password reset",
    text: '', html: html
  }
}

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

  app.get('/login/resetPassword/:resetToken', ssl.ensureSSL, function(req, res, next) {
    model.ResetToken.findOne({
      token: req.params.resetToken
    }, function(err, r) {
      if (err) return next(err)
      else if (!r) return res.status(404).send('Invalid or expired token')
      console.log(req.cookies)
      res.render('reset-password', {
        resetToken: r.token,
        csrftoken: req.cookies.csrftoken
      })
    })
  })

  app.post('/login/setPassword/:resetToken/:password', ssl.ensureSSL,
  function(req, res, next) {
    console.log('Cest la vie!', req.params, req.body)
    model.ResetToken.findOneAndRemove({
      token: req.params.token, expiryDate: {$gt: Date.now()}
    }, function(err, r) {
      console.log('token here', req.params)
      if (err) return next(err)
      else if (!r) return res.status(404).send('Invalid token')

      model.User.findOne({ email: req.params.email }, function(err, r) {
        if (err) return next(err)
        else if (!r) return res.status(404).send('No such user found')
        r.password = req.params.password // Assumption here is that 'save' method is overwritten
        r.save(function(err) {
          if (err) return next(err)

          res.status(200).send('Successfully reset your password')
        })
      })
    })
  })

  app.get('/login/forgot/:email', ssl.ensureSSL, function (req, res, next) {
    console.log(req.params.email)
    model.User.findOne({ email: req.params.email }, 'email name',
    function(err, u) {
      console.log(u)
      if (err) return next(err)
      else if (!u) return res.status(404).send(false)

      // Make sure all other reset tokens are cleared out
      model.ResetToken.remove({email: u.email}, function(err) {
        if (err) return res.redirect('/')

        // Create for a unique token as well as expiry date
        var rToken = new model.ResetToken({email: u.email})
        var fHash = crypto.createHash('sha256')
        fHash.update(rToken._id + 'X' + Math.random() + '^' + rToken._id)
        rToken.token = fHash.digest('hex')
        rToken.expiryDate = new Date(Date.now() + FORT_NIGHT_MS)

        // console.log('rToken', rToken, req)

        rToken.save(function(err, savedToken) {
          if (err) return next(err)

          var msg = composeResetMsg({
            expiryDate: savedToken.expiryDate,
            token: savedToken.token, to: u.email,
            name: u.name, mainURL: req.headers.host
          })

          email.send(msg, function(err, r) {
            if (err) return next(err)
            res.status(200).send("Please check your email address: " + u.email) 
          })
        })
      })
    })
  })
}
