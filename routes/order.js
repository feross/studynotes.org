var auto = require('run-auto')
var config = require('../config')
var debug = require('debug')('studynotes:routes/order')
var mail = require('../lib/mail')
var model = require('../model')
var parallel = require('run-parallel')
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

      order: ['stripeCharge', function (cb, r) {
        var order = new model.Order({
          stripeEmail: email,
          stripeToken: req.body.id,
          amount: amount,
          product: product,
          referrer: referrer,
          freeEssays: req.session.free,
          stripeCharge: JSON.stringify(r.stripeCharge)
        })
        order.save(cb)
      }]

    }, function (err, r) {
      if (err) {
        if (err.type === 'StripeCardError') {
          req.flash('error', 'Your card has been declined. Please try again!')
          debug('Card declined: %s', err.message)
          return res.redirect(referrer || 'back')
        } else if (err.errors) {
          // errors from mongoose validation
          values(err.errors).forEach(function (error) {
            req.flash('error', error.message)
          })
          return res.redirect(referrer || 'back')
        } else {
          return next(err)
        }
      }

      var message = {}

      if (product === 'pro') {
        // User is officially Pro now
        req.session.pro = {
          email: email,
          orderId: r.order.id
        }

        message.to = email
        message.subject = 'Thanks for buying ' + desc + '!'
        message.text = 'Congratulations! You now have access to ' + desc + '.\n\n' +

          'You can read the sample college essays by visiting: ' +
          config.siteOrigin + '/essays/\n\n' +

          'If you want to access the sample college essays on another device -- ' +
          'like a phone, tablet, or another computer -- you will need to login ' +
          'with the email and password you created.\n\n' +

          'If you have any questions, you can reply to this email.\n\n' +

          '- The Study Notes team'

        parallel([
          function (cb) {
            mail.send(message, cb)
          },
          function (cb) {
            mail.notifyAdmin('New Pro order', r.order, cb)
          }
        ], onSentEmail)
      }

      if (product === 'review-proofreading' ||
          product === 'review-standard' ||
          product === 'review-premium') {
        message.to = email
        message.subject = 'Thanks for buying ' + desc + '!'
        message.text = 'Congratulations! You purchased ' + desc + '.\n\n' +

          'A tutor will be in touch with you shortly to discuss your customized ' +
          'coaching plan.\n\n' +

          'Please reply to this email with the following information:\n\n' +

          '- Your full name\n' +
          '- Your phone number\n' +
          '- Universities you plan to apply to\n' +
          '- Your essays (please attach them to the email)\n' +

          (
            product === 'review-premium'
              ? 'If you haven\'t started on your essays yet, just let us know that.'
              : ''
          ) + '\n\n' +

          'If you have any other questions, you can include them in your response' +
          'to this email.\n\n' +

          '- The Study Notes team'

        parallel([
          function (cb) {
            mail.send(message, cb)
          },
          function (cb) {
            mail.notifyAdmin('New Essay Review order', r.order, cb)
          }
        ], onSentEmail)
      }

      function onSentEmail (err) {
        if (err) return next(err)
        // Redirect to original essay after signup/login
        req.session.returnTo = referrer
        res.sendStatus(200)
      }
    })
  })
}
