/*jslint node: true */
/*global app */
"use strict";

var _ = require('underscore')
var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')
var validate = require('mongoose-validator').validate
var util = require('../util')

var Essay = mongoose.Schema({
  name: {
    type: String,
    index: true,
    validate: [
      validate({ message: 'Please give your essay a title.' }, 'notEmpty')
    ]
  },
  body: {
    type: String,
    validate: [
      validate({ message: 'It looks like you forgot to include the actual essay.' }, 'notEmpty')
    ]
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    index: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true
  },
  slug: model.SLUG_UNIQUE
})

Essay.index({ collegeId: 1, slug: 1 })

// Trim whitespace
Essay.pre('save', function (next) {
  var essay = this
  essay.name = essay.name.trim()
  next()
})

Essay.virtual('url').get(function () {
  var essay = this
  var collegeId = this.collegeId.toString()
  var college = _.find(app.cache.colleges, function (c) {
    return c.id == collegeId
  })
  return '/' + college.slug + '/' + essay.slug + '/'
})

Essay.virtual('searchDesc').get(function () {
  var essay = this
  var collegeId = this.collegeId.toString()
  var college = _.find(app.cache.colleges, function (c) {
    return c.id == collegeId
  })

  return college.shortName + ' Admissions Essay'
})

// Sanitize essay to strip bad html before saving
Essay.pre('save', function (next) {
  var essay = this
  if (!essay.isModified('body')) return next()

  essay.body = util.sanitizeHTML(essay.body)
  next()
})

Essay.plugin(plugin.modifyDate)
Essay.plugin(plugin.createDate)
Essay.plugin(plugin.absoluteUrl)
Essay.plugin(plugin.slug, { model: 'Essay' })
Essay.plugin(plugin.hits)

module.exports = mongoose.model('Essay', Essay)