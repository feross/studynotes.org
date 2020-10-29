const model = require('./')
const mongoose = require('mongoose')
const plugin = require('./plugin')
const validate = require('mongoose-validator')

const Note = new mongoose.Schema({
  _id: {
    type: String
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
  const self = this
  if (typeof self.name === 'string') self.name = self.name.trim()
  next()
})

Note.virtual('url').get(function () {
  const courseId = this.populated('course') || this.course
  const notetypeId = this.populated('notetype') || this.notetype

  return '/' + courseId + '/' + notetypeId + '/' + this._id + '/'
})

Note.virtual('searchDesc').get(function () {
  const self = this

  const courseId = self.populated('course') || self.course
  const course = model.cache.courses[courseId]
  const notetypeId = self.populated('notetype') || self.notetype
  const notetype = course.notetypes.filter(function (n) {
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
