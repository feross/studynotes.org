var mongoose = require('mongoose')
var plugin = require('./plugin')

var College = new mongoose.Schema({
  _id: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  shortName: {
    type: String,
    required: true,
    index: true
  },
  desc: {
    type: String,
    required: true
  },
  rank: {
    type: Number,
    index: true
  },
  tuition: Number,
  inStateTuition: Number,
  enrollment: Number,
  acceptRate: Number,
  location: String
})

College.virtual('url').get(function () {
  return '/' + this._id + '/'
})

College.virtual('searchDesc').get(function () {
  return 'Admissions Essays'
})

College.virtual('heroImage').get(function () {
  return this._id + '.jpg'
})

College.plugin(plugin.modifyDate)
College.plugin(plugin.createDate)
College.plugin(plugin.absoluteUrl)
College.plugin(plugin.slug, { model: 'College' })
College.plugin(plugin.hits)

module.exports = College
