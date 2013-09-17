var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')

var College = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  shortName: { type: String, required: true, unique: true },
  tuition: { type: Number, required: true },
  inStateTuition: { type: Number },
  enrollment: { type: Number, required: true },
  acceptRate: { type: Number, required: true },
  location: {type: String, required: true },
  rank: {type: Number, required: true, index: true },
  slug: model.SLUG_UNIQUE
})

College.virtual('url').get(function () {
  return '/' + this.slug + '/'
})

College.virtual('searchDesc').get(function () {
  return 'University'
})

College.virtual('heroImage').get(function () {
  return this.slug + '.jpg'
})

College.plugin(plugin.modifyDate)
College.plugin(plugin.createDate)
College.plugin(plugin.absoluteUrl)
College.plugin(plugin.slug, { model: 'College' })
College.plugin(plugin.hits)

module.exports = mongoose.model('College', College)