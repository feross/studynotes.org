var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')
var validate = require('mongoose-validator')
var util = require('../util')

var Note = new mongoose.Schema({
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
        message: 'Please give the note a title.'
      })
    ]
  },
  body: {
    type: String,
    validate: [
      validate({
        validator: 'isLength',
        arguments: 100,
        message: 'It looks like you forgot to include the actual note.'
      })
    ]
  },
  ordering: {
    type: Number,
    index: true
  },
  course: {
    type: String,
    ref: 'Course',
    index: true,
    required: true
  },
  notetype: {
    type: String,
    ref: 'Notetype',
    index: true,
    required: true
  },
  user: {
    type: String,
    ref: 'User',
    index: true,
    required: true
  },
  anon: Boolean
})

Note.index({ course: 1, notetype: 1})

// Trim whitespace
Note.pre('validate', function (next) {
  var self = this
  self.name = self.name.trim()
  next()
})

Note.virtual('url').get(function () {
  var courseId = this.populated('course') || this.course
  var notetypeId = this.populated('notetype') || this.notetype

  return '/' + courseId + '/' + notetypeId + '/' + this._id + '/'
})

Note.virtual('searchDesc').get(function () {
  var self = this

  var courseId = self.populated('course') || self.course
  var course = model.cache.courses[courseId]
  var notetypeId = self.populated('notetype') || self.notetype
  var notetype = course.notetypes.filter(function (n) {
    return n.id === notetypeId
  })[0]

  return course.name + ' ' + (notetype.singularName || notetype.name)
})

// Sanitize to strip bad html before saving
Note.pre('save', function (next) {
  var self = this
  if (self.isModified('body')) {
    self.body = util.sanitizeHTML(self.body)
  }
  next()
})

Note.plugin(plugin.modifyDate)
Note.plugin(plugin.createDate)
Note.plugin(plugin.absoluteUrl)
Note.plugin(plugin.slug, { model: 'Note' })
Note.plugin(plugin.hits)

module.exports = Note
