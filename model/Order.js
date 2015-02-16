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

  referringEssay: {
    type: String,
    ref: 'Essay'
  },
  freeEssays: [{
    type: String,
    ref: 'Essay'
  }],

  user: {
    type: String,
    ref: 'User'
  }
})

Order.plugin(plugin.modifyDate)
Order.plugin(plugin.createDate)

module.exports = Order
