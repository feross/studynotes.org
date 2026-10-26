const model = require('../model')
const url = require('url')

/**
 * Middleware to check if a user just signed up for Pro and upgrade their
 * logged in account so their Pro status is permanent.
 */
exports.checkPro = async function (req, res, next) {
  if (!req.session.pro) return next()

  if (!req.isAuthenticated()) {
    if (req.url.indexOf('/signup/') !== 0 && req.url.indexOf('/login/') !== 0) {
      // Is there a registered user with the same email used for Stripe?
      // If so, we want them to encourage them to link their account by
      // redirecting to login page. They are still free to sign up for a new
      // account if they want.

      const params = url.parse(req.url, true).search || '' // eslint-disable-line node/no-deprecated-api

      let user = null
      try {
        if (req.session.pro.email) {
          user = await model.User.findOne({ email: req.session.pro.email })
        }
      } catch (err) {}

      if (user) res.redirect('/login/' + params)
      else res.redirect('/signup/' + params)
      return
    } else {
      return next()
    }
  }

  try {
    req.user.pro = true
    const [order] = await Promise.all([
      model.Order.findOne({ _id: req.session.pro.orderId }),
      req.user.save()
    ])

    order.user = req.user.id
    await order.save()
  } catch (err) {
    return next(err)
  }

  delete req.session.pro
  next()
}
