var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')
var validate = require('mongoose-validator')
var util = require('../util')

var Essay = new mongoose.Schema({
  _id: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    index: true,
    validate: [
      validate({
        validator: 'isLength',
        arguments: 1,
        message: 'Your essay needs a title, silly!'
      })
    ]
  },
  prompt: String,
  body: {
    type: String,
    validate: [
      validate({
        validator: 'isLength',
        arguments: 100,
        message: 'It looks like you forgot to include the actual essay.'
      })
    ]
  },
  bodyPaywall: {
    type: String
  },
  bodyTruncate: {
    type: String
  },
  college: {
    type: 'String',
    ref: 'College',
    index: true,
    required: true
  },
  user: {
    type: String,
    ref: 'User',
    index: true,
    required: true
  },
  admitsphere: Boolean,
  anon: Boolean,
  published: Boolean
})

// Trim whitespace
Essay.pre('validate', function (next) {
  var self = this
  if (typeof self.name === 'string') self.name = self.name.trim()
  next()
})

Essay.virtual('url').get(function () {
  var self = this
  var collegeSlug = self.populated('college') || self.college
  return '/' + collegeSlug + '/' + self._id + '/'
})

Essay.virtual('searchDesc').get(function () {
  var self = this
  var collegeSlug = self.populated('college') || self.college
  var college = model.cache.colleges[collegeSlug]

  return college.shortName + ' Admissions Essay'
})

// Sanitize essay to strip bad html before saving
Essay.pre('save', function (next) {
  var self = this
  if (self.isModified('prompt')) self.prompt = util.sanitizeHTML(self.prompt)

  if (self.isModified('body')) {
    self.body = util.sanitizeHTML(self.body)
    self.bodyTruncate = util.truncate(util.sanitizeHTML(self.body, ['p']), 300).trim()
    util.convertToPaywallText(self.body, 2, function (err, html) {
      if (err) return next(err)
      self.bodyPaywall = html
      next()
    })
  } else {
    next()
  }
})

Essay.plugin(plugin.modifyDate)
Essay.plugin(plugin.createDate)
Essay.plugin(plugin.absoluteUrl)
Essay.plugin(plugin.slug, { model: 'Essay' })
Essay.plugin(plugin.hits)

module.exports = Essay
