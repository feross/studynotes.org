/*jslint node: true */
"use strict";

var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')

var College = mongoose.Schema({
  _id: {
    type: String,
    unique: true
  },
  name: { type: String, required: true, index: true },
  shortName: { type: String, required: true, index: true },
  desc: { type: String, required: true },
  tuition: { type: Number, required: true },
  inStateTuition: { type: Number },
  enrollment: { type: Number, required: true },
  acceptRate: { type: Number, required: true },
  location: {type: String, required: true },
  rank: {type: Number, required: true, index: true }
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
College.plugin(plugin.slug)
College.plugin(plugin.hits)

module.exports = mongoose.model('College', College)