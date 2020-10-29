const auto = require('run-auto')
const config = require('../config')
const debug = require('debug')('studynotes:routes/order')
const model = require('../model')
const secret = require('../secret')

const stripe = require('stripe')(secret.stripe)

module.exports = function (app) {
  app.post('/order', function (req, res, next) {
    const product = req.body.product
    const desc = config.product[product].desc
    const amount = config.product[product].price
    const email = req.body.email
    const referrer = req.body.referrer

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
        const order = new model.Order({
          stripeEmail: email,
          stripeToken: req.body.id,
          amount: amount,
          product: product,
          referrer: referrer,
          freeEssays: req.session.free,
          stripeCharge: JSON.stringify(r.stripeCharge)
        })
        order.save(function (err, order) {
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
          const errors = Object.values(err.errors).map((err) => err.message)
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
