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
  var from = params.from || '"StudyNotes Admin" <admin@apstudynotes.org>'
  var protocol = ''
  if (!/^https?:\/\//g.exec(params.mainURL || ''))
    protocol = 'http://'
  
  var html = util.format(
      'Hey %s,<br /><ul />We recently received a password reset from you.<br /><br />' +
      'Please click <a href="%s%s/login/resetPassword/%s">here</a> to reset it before: %s',
      params.name, protocol, params.mainURL, params.token, params.expiryDate)

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
    model.ResetToken.findOne({ token: req.params.resetToken }, function(err, r) {
      if (err) return next(err)
      else if (!r) return res.status(404).send('Invalid or expired token')

      res.render('reset-password', {
        resetToken: r.token
      })
    })
  })

  app.post('/login/setPassword', ssl.ensureSSL,
  function(req, res, next) {

    var params = req.body

    model.ResetToken.findOne({
      token: params.resetToken, expiryDate: {$gt: Date.now()}
    }, function(err, rToken) {

      if (err) return next(err)
      else if (!rToken) return res.status(404).send('Invalid token')

      model.User.findOne({ email: rToken.email }, function(err, r) {
        if (err) return next(err)
        else if (!r) return res.status(404).send('No such user found')

        // Assumption here is that 'save' method does all the hashing
        r.password = params.password
        r.save(function(err) {
          if (err) {
            if (err && err.errors && err.errors.password && err.errors.password.message)
              return res.render('reset-password', {
                email: rToken.email,
                resetToken: rToken.token,
                errors: [err.errors.password.message]
              })

            return next(err) 
          }

          // Time to clear out the token
          model.ResetToken.findOneAndRemove({ _id: rToken._id },
          function(err, retrToken) {
            if (err) return next(err)

            // Somehow between a reset someone this token disappeared -- security compromise
            if (!retrToken) {
              return res.status(404).send(
                'Your token unexplicably disappeared! If you believe this might be ' +
                'a security compromise, please contact the site administrator!'
              )
            }

            /*
            Auto fill the info for them
            res.render('login', {
              title: 'Successfully reset your password! Please login! Redirecting you to the login',
              url: '/login',
              email: retrToken.email,
              errors: ''
            })
            */

            res.redirect('/login')
          })
        })
      })
    })
  })

  app.get('/login/forgot', ssl.ensureSSL, function (req, res, next) {
    res.render('forgot-password', {
      errors: ''
    })
  })

  app.post('/login/forgot', ssl.ensureSSL, function (req, res, next) {
    model.User.findOne({ email: req.body.email }, 'email name', function(err, u) {

      if (err)
        return next(err)

      if (!u) {
        return res.render('reset-password-status', {
          msg: '',
          errors: ['No such email exists in our records!']
        })
      }

      // Make sure all previous reset tokens are cleared out
      model.ResetToken.findOneAndRemove({ email: u.email }, function(err, r) {

        if (err) return res.redirect('/')

        // Create for a unique token as well as expiry date
        var rToken = new model.ResetToken({email: u.email})

        var fHash = crypto.createHash('sha256')
        fHash.update(rToken._id + 'X' + Math.random() + '^' + rToken._id)

        rToken.token = fHash.digest('hex')
        rToken.expiryDate = new Date(Date.now() + FORT_NIGHT_MS)

        rToken.save(function(err, savedToken) {

          if (err) return next(err)

          var msg = composeResetMsg({
            expiryDate: savedToken.expiryDate,
            token: savedToken.token, to: u.email,
            name: u.name, mainURL: req.headers.host
          })

          email.send(msg, function(err, r) {
            if (err) return next(err)

            var errors = []
            if (!(r && r.accepted && r.accepted.length >= 1))
              errors.push('Emailing got no response back. Please try again!')

            if (r.rejected && r.rejected.length >= 1) {
              for (var i = 0, len = r.rejected.length; i < len; i++) {
                if (r.rejected[i] === u.email)
                  errors.push('The email you provided got rejected!')
              }
            }

            // Potential security hole detected if our records don't match those from emailer!
            if (r.accepted[0] !== u.email)
              errors.push('The accepted email was not the one matching our records!')

            var msg = 'Fail'
            if (! (errors && errors.length >= 1))
              msg = 'Successfully sent a reset email to: ' + u.email

            res.render('reset-password-status', {
              msg: msg,
              errors: errors
            })
          })
        })
      })
    })
  })
}
