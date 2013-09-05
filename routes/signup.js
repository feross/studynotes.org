var bcrpyt = require('bcrypt')
var model = require('../model')

module.exports = function () {
  app.get('/signup', function (req, res) {
    if (req.user) {
      res.redirect('/')
    } else {
      res.render('signup', { errors: req.flash('error') })
    }
  })

  app.post('/signup', function (req, res, next) {
    req.assert('email', 'Not a valid email address').isEmail()
    req.assert('password', 'Password must be greater than 4 characters').len(4).notEmpty()

    var errors = req.validationErrors()
    if (errors) {
      errors.forEach(function (error) {
        req.flash('error', error.msg)
        debug('Registration error: ' + error.msg)
      })
      res.redirect('/signup')
      return
    }

    // TODO: validate and only store properties that we are expecting
    var email = req.body.email
    app.db.User
      .findOne({ email: email})
      .exec(function (err, user) {
        if (err && err.name === 'NotFoundError') {

          self.db.put('user!' + email, req.body, function (err) {
            if (err) {
              req.flash('error', err.name + ': ' + err.message)
              res.redirect('/signup')
            } else {
              // Automatically login the user upon registration
              req.login(req.body, function (err) {
                if (err) { return next(err) }
                return res.redirect('/onboard')
              })
            }
          })
        } else if (err) {
          req.flash('error', err.name + ': ' + err.message)
          debug('LevelDB Error: ' + err.message)
          res.redirect('/signup')
        } else {
          req.flash('error', 'Username is already registered.')
          debug('Username is already registered')
          res.redirect('/signup')
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