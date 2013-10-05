/*jslint node: true */
"use strict";

var _ = require('underscore')
var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')

var Note = mongoose.Schema({
  _id: {
    type: String,
    unique: true
  },
  name: { type: String, required: true, index: true },
  body: { type: String, required: true },
  course: {
    type: String,
    ref: 'Course',
    required: true
  },
  notetype: {
    type: String,
    ref: 'Notetype',
    required: true
  },
  ordering: Number
})

Note.index({ course: 1, notetype: 1})

Note.virtual('url').get(function () {
  var courseId = this.populated('course') || this.course
  var notetypeId = this.populated('notetype') || this.notetype

  return '/' + courseId + '/' + notetypeId + '/' + this._id + '/'
})

Note.virtual('searchDesc').get(function () {
  var note = this

  var courseId = note.populated('course') || note.course
  var course = model.cache.courses[note.courseId]
  var notetype = _.find(course.notetypes, function (n) {
    return n.id == note.notetype
  })

  return course.name + ' ' + (notetype.singularName || notetype.name)
})

Note.plugin(plugin.modifyDate)
Note.plugin(plugin.createDate)
Note.plugin(plugin.absoluteUrl)
Note.plugin(plugin.slug, { model: 'Note' })
Note.plugin(plugin.hits)

module.exports = mongoose.model('Note', Note)