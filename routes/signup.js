var async = require('async')
var bcrpyt = require('bcrypt')
var model = require('../model')

module.exports = function () {
  app.get('/signup', function (req, res) {
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
      res.render('signup', { errors: req.flash('error') })
    }
  })

  app.post('/signup', function (req, res, next) {
    req.sanitize('name').trim()
    req.sanitize('email').trim()

    req.assert('name', 'Please use your full name').notEmpty()
    req.assert('email', 'Email address is not valid').isEmail()
    req.assert('password', 'Password must be longer than 6 characters').len(4).notEmpty()

    var errors = req.validationErrors()
    if (errors) {
      errors.forEach(function (error) {
        req.flash('error', error.msg)
        debug('Registration error: ' + error.msg)
      })
      res.redirect('/signup')
      return
    }

    var user = new model.User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    })
    user.save(function (err) {
      if (err && err.code === 11000) {
        req.flash('error', 'A user is already using that email address')
        res.redirect('/signup')
      } else if (err) {
        next(err)
      } else {
        // Automatically login the user
        req.login(user, function (err) {
          if (err) next(err)
          else res.redirect('/signup') // for next redirect
        })
      }
    })
  })
}

// TODO: add users to Mailchimp
// module.exports = function () {
//   app.post('/subscribe', function (req, res) {
//     try {
//       var api = new MailChimpAPI(secret.mailchimp.key, { version : '2.0' })
//     } catch (e) {
//       console.error(e)
//     }

//     var email = req.body.email

//     api.call('lists', 'subscribe', {
//       email: { email: email },
//       id: secret.mailchimp.listId
//     }, function (err, data) {
//       if (err) {
//         console.error(err)
//         res.send({ status: 'error' })
//       } else {
//         res.send({ status: 'ok' })
//       }
//     })
//   })
// }