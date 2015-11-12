var config = require('../config')
var mail = require('../lib/mail')
var mongoose = require('mongoose')
var plugin = require('./plugin')
var validate = require('mongoose-validator')

var Order = new mongoose.Schema({
  stripeEmail: {
    type: String,
    validate: [
      validate({
        validator: 'isEmail',
        message: 'Invalid email address'
      })
    ]
  },
  stripeToken: {
    type: String,
    unique: true,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  stripeCharge: {
    type: String,
    required: true
  },
  product: {
    type: String,
    required: true
  },
  referrer: String,
  freeEssays: [{
    type: String,
    ref: 'Essay'
  }],
  user: {
    type: String,
    ref: 'User'
  }
})

Order.pre('save', function (next) {
  this.wasNew = this.isNew // for post-save
})

Order.post('save', function (order) {
  if (!order.wasNew) return

  var message = {}
  var email = order.stripeEmail
  var desc = config.product[order.product].desc

  if (order.product === 'pro') {
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

    mail.send(message, function (err) {
      if (err) throw err
    })
  }

  var reviewProducts = [
    'review-proofreading',
    'review-standard',
    'review-premium'
  ]

  if (reviewProducts.indexOf(order.product) >= 0) {
    message.to = email
    message.subject = 'Thanks for buying ' + desc + '!'
    message.text = 'Congratulations! You purchased ' + desc + ' from Study Notes.\n\n' +

      'A tutor will be in touch with you shortly to discuss your customized ' +
      'coaching plan.\n\n' +

      'Please reply to this email with the following information:\n\n' +

      '- Your full name\n' +
      '- Your phone number\n' +
      '- Universities you plan to apply to\n' +
      '- Your essays (please attach them to the email)\n\n' +

      (
        order.product === 'review-premium'
          ? 'If you haven\'t started on your essays yet, just let us know that.\n\n'
          : ''
      ) +

      'If you have any other questions, you can include them in your response ' +
      'to this email.\n\n' +

      '- The Study Notes team\n' +
      config.siteOrigin

    mail.send(message, function (err) {
      if (err) throw err
    })
    mail.notifyAdmin('New Essay Review order', order, function (err) {
      if (err) throw err
    })
  }
})

Order.plugin(plugin.modifyDate)
Order.plugin(plugin.createDate)

module.exports = Order
