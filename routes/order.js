const config = require('../config')
const debug = require('debug')('studynotes:routes/order')
const model = require('../model')
const secret = require('../secret')

const stripe = require('stripe')(secret.stripe)

module.exports = function (app) {
  app.post('/order', async function (req, res, next) {
    const product = req.body.product
    if (!config.product[product]) return next(new Error('Unknown product: ' + product))
    const desc = config.product[product].desc
    const amount = config.product[product].price
    const email = req.body.email
    const referrer = req.body.referrer

    let order
    try {
      const stripeCharge = await stripe.charges.create({
        amount: amount,
        currency: 'usd',
        source: req.body.id,
        description: desc + ' (' + email + ')',
        receipt_email: email
      })

      order = new model.Order({
        stripeEmail: email,
        stripeToken: req.body.id,
        amount: amount,
        product: product,
        referrer: referrer,
        freeEssays: req.session.free,
        stripeCharge: JSON.stringify(stripeCharge)
      })
      await order.save()
    } catch (err) {
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
        orderId: order.id
      }
    }

    // Redirect back to referrer after signup/login
    req.session.returnTo = referrer

    res.sendStatus(200)
  })
}
