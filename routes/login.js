var auth = require('../lib/auth')
var config = require('../config')
var email = require('../lib/email')
var model = require('../model')
var passport = require('passport')
var util = require('../util')
var waterfall = require('run-waterfall')

module.exports = function (app) {
  app.get('/login', auth.returnTo, function (req, res) {
    if (req.user) return res.redirect(req.session.returnTo || '/')
    res.render('login', {
      title: 'Login',
      url: '/login',
      // pre-fill for Pro users who haven't linked accounts yet
      email: req.session.pro && req.session.pro.email,
      errors: req.flash('error')
    })
  })

  app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login/',
    successReturnToOrRedirect: '/',
    failureFlash: 'Wrong email or password.',
    successFlash: 'You are logged in!'
  }))

  app.post('/logout', function (req, res) {
    // Give Pro users their "first click, free" back when they logout
    if (req.isAuthenticated() && req.user.pro) delete req.session.free

    req.logout()
    res.send(200) // redirect happens on client-side
  })

  app.get('/login/forgot', function (req, res) {
    if (req.user) return res.redirect(req.session.returnTo || '/')
    res.render('login-forgot', {
      title: 'Forgot Password',
      url: '/login/forgot',
      errors: req.flash('error')
    })
  })

  app.post('/login/forgot', function (req, res, next) {
    waterfall([
      util.randomBytes,
      function (token, cb) {
        model.User.findOne({ email: req.body.email }, function (err, user) {
          if (err || !user) {
            req.flash('error', 'No account with that email address exists.')
            return res.redirect('/login/forgot')
          }

          user.resetPasswordToken = token
          user.resetPasswordExpires = Date.now() + 3600000 // 1 hour

          user.save(function (err) {
            cb(err, token, user)
          })
        })
      },
      function (token, user, cb) {
        var message = {}
        message.to = user.email
        message.subject = 'Study Notes Password Reset'

        message.text = 'You are receiving this because you (or someone else) requested ' +
          'the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to ' +
          'complete the process:\n\n' +
          config.siteOrigin + '/login/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password ' +
          'will remain unchanged.\n'

        email.send(message, function (err) {
          if (err) return cb(err)
          req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.')
          cb(null)
        })
      }
    ], function (err) {
      if (err) return next(err)
      res.redirect('/login/forgot')
    })
  })

  app.get('/login/reset/:token', function (req, res) {
    model.User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    }, function (err, user) {
      if (err || !user) {
        req.flash('error', 'Password reset token is invalid or has expired.')
        return res.redirect('/login/forgot')
      }
      res.render('login-reset', {
        title: 'Forgot Password',
        url: '/login/forgot',
        errors: req.flash('error')
      })
    })
  })

  app.post('/login/reset/:token', function (req, res, next) {
    waterfall([
      function (cb) {
        model.User.findOne({
          resetPasswordToken: req.params.token,
          resetPasswordExpires: { $gt: Date.now() }
        }, function (err, user) {
          if (err || !user) {
            req.flash('error', 'Password reset token is invalid or has expired.')
            return res.redirect('/login/forgot')
          }

          user.password = req.body.password
          user.resetPasswordToken = undefined
          user.resetPasswordExpires = undefined

          user.save(function (err) {
            if (err) return cb(err)
            req.login(user, function (err) {
              cb(err, user)
            })
          })
        })
      },
      function (user, cb) {
        var message = {}
        message.to = user.email
        message.subject = 'Your Study Notes password was changed'

        message.text = 'Hello,\n\n' +
          'This is a confirmation that the password for your Study Notes account ' +
          'with email ' + user.email + ' has just been changed.\n'

        email.send(message, function (err) {
          if (err) return cb(err)
          req.flash('success', 'Success! Your password has been changed.')
          cb(null)
        })
      }
    ], function (err) {
      if (err) return next(err)
      res.redirect('/')
    })
  })
}
