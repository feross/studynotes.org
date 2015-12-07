var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')
var validate = require('mongoose-validator')

var Note = new mongoose.Schema({
  _id: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    index: true,
    required: 'Please give the note a title.',
    validate: [
      validate({
        validator: 'isLength',
        arguments: 1,
        message: 'Please give the note a title.'
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
  anon: Boolean,
  published: Boolean
})

Note.index({ course: 1, notetype: 1 })

// Trim whitespace
Note.pre('validate', function (next) {
  var self = this
  if (typeof self.name === 'string') self.name = self.name.trim()
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

Note.plugin(plugin.body, { model: 'Note' })
Note.plugin(plugin.modifyDate)
Note.plugin(plugin.createDate)
Note.plugin(plugin.absoluteUrl)
Note.plugin(plugin.slug, { model: 'Note' })
Note.plugin(plugin.hits)

module.exports = Note
