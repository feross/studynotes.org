var async = require('async')
var model = require('../model')

/**
 * Middleware to check if a user just signed up for Pro and upgrade their
 * logged in account so their Pro status is permanent.
 */
exports.checkPro = function (req, res, next) {
  if (!req.session.pro)
    return next()

  console.log(req.url)
  if (!req.isAuthenticated()) {
    if (req.url.indexOf('/signup/') === -1 && req.url.indexOf('/login/') === -1)
      return res.redirect('/signup/')
    else
      return next()
  }

  async.auto({
    makeUserPro: function (cb) {
      req.user.pro = true
      req.user.save(cb)
    },

    order: function (cb) {
      model.Order
        .findOne({ _id: req.session.pro.orderId })
        .exec(cb)
    },

    linkOrderToUser: ['order', function (cb, r) {
      r.order.user = req.user.id
      r.order.save(cb)
    }]

  }, function (err) {
    if (err) return next(err)

    delete req.session.pro
    next()
  })
}