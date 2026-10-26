const auth = require('../lib/auth')
const model = require('../model')

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

  app.post('/signup', async function (req, res, next) {
    const user = new model.User({
      name: req.body.name,
      email: req.body.email || (req.session.pro && req.session.pro.email),
      password: req.body.password
    })
    try {
      await user.save()
    } catch (err) {
      if (err.code === 11000) {
        req.flash('error', 'A user is already using that email address.')
        req.flash('user', req.body)
        return res.redirect('/signup/')
      } else if (err.name === 'ValidationError') {
        Object.values(err.errors).forEach(function (error) {
          req.flash('error', error.message)
        })
        req.flash('user', req.body)
        return res.redirect('/signup/')
      }
      return next(err)
    }

    // Automatically login the user
    req.login(user, function (err) {
      if (err) return next(err)
      if (req.session.pro && req.session && req.session.returnTo) {
        const url = req.session.returnTo
        delete req.session.returnTo
        res.redirect(url)
      } else {
        res.redirect('/signup2/')
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

  app.post('/signup2', async function (req, res, next) {
    const user = req.user
    if (!user) return next(new Error('No logged in user'))

    let college = model.cache.colleges[req.body.college]
    if (college && college.id === 'common-app') college = null

    user.college = college && college.id
    user.collegeMajor = req.body.collegeMajor || undefined
    user.collegeYear = req.body.collegeYear || undefined

    try {
      await user.save()
    } catch (err) {
      if (err.name === 'ValidationError') {
        Object.values(err.errors).forEach(function (error) {
          req.flash('error', error.message)
        })
        req.flash('user', req.body)
        return res.redirect('/signup2/')
      }
      return next(err)
    }

    if (req.session && req.session.returnTo) {
      const url = req.session.returnTo
      delete req.session.returnTo
      res.redirect(url)
    } else {
      res.redirect('/submit/essay/')
    }
  })
}
