var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')

var ResetToken = mongoose.Schema({
  expiryDate: { type: Date },
  token: { type: String, required: true},
  email: { type: String, required: true}
})


ResetToken.plugin(plugin.createDate)
ResetToken.plugin(plugin.modifyDate)

ResetToken.plugin(plugin.slug, { model: 'ResetToken' })

module.exports = ResetToken
