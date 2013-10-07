/*jslint node: true */
"use strict";

var _ = require('underscore')
var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')
var validate = require('mongoose-validator').validate
var util = require('../util')

var Essay = mongoose.Schema({
  _id: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    index: true,
    validate: [
      validate({ message: 'Please give the essay a title.' }, 'notEmpty')
    ]
  },
  prompt: String,
  body: {
    type: String,
    validate: [
      validate({ message: 'It looks like you forgot to include the actual essay.' }, 'notEmpty')
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
Essay.pre('save', function (next) {
  var essay = this
  essay.name = essay.name.trim()
  next()
})

Essay.virtual('url').get(function () {
  var essay = this
  var collegeSlug = essay.populated('college') || essay.college
  return '/' + collegeSlug + '/' + essay._id + '/'
})

Essay.virtual('searchDesc').get(function () {
  var essay = this
  var collegeSlug = essay.populated('college') || essay.college
  var college = model.cache.colleges[collegeSlug]

  return college.shortName + ' Admissions Essay'
})

// Sanitize essay to strip bad html before saving
Essay.pre('save', function (next) {
  var essay = this
  if (essay.isModified('body')) {
    essay.body = util.sanitizeHTML(essay.body)
  }
  if (essay.isModified('prompt')) {
    essay.prompt = util.sanitizeHTML(essay.prompt)
  }
  next()
})

Essay.plugin(plugin.modifyDate)
Essay.plugin(plugin.createDate)
Essay.plugin(plugin.absoluteUrl)
Essay.plugin(plugin.slug)
Essay.plugin(plugin.hits)

module.exports = mongoose.model('Essay', Essay)