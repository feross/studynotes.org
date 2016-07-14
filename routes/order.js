var auto = require('run-auto')
var config = require('../config')
var debug = require('debug')('studynotes:routes/order')
var model = require('../model')
var secret = require('../secret')
var values = require('object-values')

var stripe = require('stripe')(secret.stripe)

module.exports = function (app) {
  app.post('/order', function (req, res, next) {
    var product = req.body.product
    var desc = config.product[product].desc
    var amount = config.product[product].price
    var email = req.body.email
    var referrer = req.body.referrer

    auto({
      stripeCharge: function (cb) {
        stripe.charges.create({
          amount: amount,
          currency: 'usd',
          source: req.body.id,
          description: desc + ' (' + email + ')',
          receipt_email: email
        }, cb)
      },

      order: ['stripeCharge', function (r, cb) {
        var order = new model.Order({
          stripeEmail: email,
          stripeToken: req.body.id,
          amount: amount,
          product: product,
          referrer: referrer,
          freeEssays: req.session.free,
          stripeCharge: JSON.stringify(r.stripeCharge)
        })
        order.save(function (err, order, numAffected) {
          cb(err, order)
        })
      }]

    }, function (err, r) {
      if (err) {
        if (err.type === 'StripeCardError') {
          debug('Card declined: %s', err.message)
          return res.send({
            err: 'Your card was declined.'
          })
        } else if (err.errors) {
          var errors = values(err.errors).map((err) => err.message)
          return res.send({
            err: errors.join('. ')
          })
        } else {
          return next(err)
        }
      }

      if (product === 'pro') {
        // User is officially Pro now
        req.session.pro = {
          email: email,
          orderId: r.order.id
        }
      }

      // Redirect back to referrer after signup/login
      req.session.returnTo = referrer

      res.sendStatus(200)
    })
  })
}
