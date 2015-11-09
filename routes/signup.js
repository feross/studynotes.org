var auth = require('../lib/auth')
var config = require('../config')
var mail = require('../lib/mail')
var model = require('../model')
var values = require('object-values')

module.exports = function (app) {
  // Page 1
  app.get('/signup', auth.returnTo, function (req, res) {
    if (req.user) {
      res.redirect('/')
    } else {
      res.render('signup', {
        title: 'Sign Up',
        url: '/signup',
        errors: req.flash('error'),
        user: req.flash('user')[0]
      })
    }
  })

  app.post('/signup', function (req, res, next) {
    var user = new model.User({
      name: req.body.name,
      email: req.body.email || (req.session.pro && req.session.pro.email),
      password: req.body.password
    })
    user.save(function (err) {
      if (err && err.code === 11000) {
        req.flash('error', 'A user is already using that email address.')
        req.flash('user', req.body)
        res.redirect('/signup/')
      } else if (err && err.name === 'ValidationError') {
        values(err.errors).forEach(function (error) {
          req.flash('error', error.message)
        })
        req.flash('user', req.body)
        res.redirect('/signup/')
      } else if (err) {
        next(err)
      } else {
        // Automatically login the user
        req.login(user, function (err) {
          if (err) return next(err)
          if (req.session.pro && req.session && req.session.returnTo) {
            var url = req.session.returnTo
            delete req.session.returnTo
            res.redirect(url)
          } else {
            res.redirect('/signup2/')
          }
        })
      }
    })
  })

  // Page 2
  app.get('/signup2', auth.returnTo, function (req, res) {
    if (!req.user) return res.redirect('/signup/')
    res.render('signup2', {
      errors: req.flash('error'),
      user: req.flash('user')[0]
    })
  })

  app.post('/signup2', function (req, res, next) {
    var user = req.user
    if (!user) return next(new Error('No logged in user'))

    var college = model.cache.colleges[req.body.college]
    if (college && college.id === 'common-app') college = null

    user.college = college && college.id
    user.collegeMajor = req.body.collegeMajor || undefined
    user.collegeYear = req.body.collegeYear || undefined

    user.save(function (err) {
      if (err && err.name === 'ValidationError') {
        values(err.errors).forEach(function (error) {
          req.flash('error', error.message)
        })
        req.flash('user', req.body)
        res.redirect('/signup2/')
      } else if (err) {
        next(err)
      } else {
        if (req.session && req.session.returnTo) {
          var url = req.session.returnTo
          delete req.session.returnTo
          res.redirect(url)
        } else {
          res.redirect('/submit/essay/')
        }

        // Send signup email
        var message = {}
        message.to = user.email
        message.subject = 'Welcome to Study Notes'

        message.text = 'Hi ' + user.name.split(' ')[0] + ',\n\n' +

          'Thanks for signing up for Study Notes <' + config.siteOrigin + '>.\n\n' +

          'I\'m the founder and CEO of Study Notes, and I wanted to personally ' +
          'reach out to welcome you to the product.\n\n' +

          'We are building the best and simplest learning tools to empower ' +
          'students to accelerate their learning – i.e. to learn more ' +
          'effectively, in a shorter time, and with better long-term recall.\n\n' +

          'Study Notes is used by millions of students in all 50 U.S. states to ' +
          'prepare for AP exams and college admissions.\n\n' +

          'If you have any questions about the site, you can reply to this ' +
          'email.\n\n' +

          '- Feross and the Study Notes team'

        mail.send(message, function (err) {
          if (err) throw err
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
