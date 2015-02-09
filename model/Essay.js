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
  anon: Boolean
})

// Trim whitespace
Essay.pre('validate', function (next) {
  var self = this
  self.name = self.name.trim()
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
  if (self.isModified('body')) {
    self.body = util.sanitizeHTML(self.body)
  }
  if (self.isModified('prompt')) {
    self.prompt = util.sanitizeHTML(self.prompt)
  }
  next()
})

Essay.plugin(plugin.modifyDate)
Essay.plugin(plugin.createDate)
Essay.plugin(plugin.absoluteUrl)
Essay.plugin(plugin.slug, { model: 'Essay' })
Essay.plugin(plugin.hits)

module.exports = Essay
