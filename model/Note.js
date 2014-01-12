/*jslint node: true */

var _ = require('underscore')
var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')
var validate = require('mongoose-validator').validate
var util = require('../util')

var Note = mongoose.Schema({
  _id: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    index: true,
    validate: [
      validate({ message: 'Please give the note a title.' }, 'notEmpty')
    ]
  },
  body: {
    type: String,
    validate: [
      validate({ message: 'It looks like you forgot to include the actual note.' }, 'notEmpty')
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
  var note = this
  note.name = note.name.trim()
  next()
})

Note.virtual('url').get(function () {
  var courseId = this.populated('course') || this.course
  var notetypeId = this.populated('notetype') || this.notetype

  return '/' + courseId + '/' + notetypeId + '/' + this._id + '/'
})

Note.virtual('searchDesc').get(function () {
  var note = this

  var courseId = note.populated('course') || note.course
  var course = model.cache.courses[courseId]
  var notetypeId = note.populated('notetype') || note.notetype
  var notetype = _.find(course.notetypes, function (n) {
    return n.id === notetypeId
  })

  return course.name + ' ' + (notetype.singularName || notetype.name)
})

// Sanitize to strip bad html before saving
Note.pre('save', function (next) {
  var note = this
  if (note.isModified('body')) {
    note.body = util.sanitizeHTML(note.body)
  }
  next()
})

Note.plugin(plugin.modifyDate)
Note.plugin(plugin.createDate)
Note.plugin(plugin.absoluteUrl)
Note.plugin(plugin.slug, { model: 'Note' })
Note.plugin(plugin.hits)

module.exports = Note