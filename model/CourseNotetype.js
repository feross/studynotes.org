/*jslint node: true */
"use strict";

var _ = require('underscore')
var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')

var CourseNotetype = mongoose.Schema({
  course: {
    type: String,
    ref: 'Course'
  },
  notetype: {
    type: String,
    ref: 'Notetype'
  }
})

CourseNotetype.virtual('url').get(function() {
  var courseId = this.populated('course') || this.course
  var notetypeId = this.populated('notetype') || this.notetype

  return '/' + courseId + '/' + notetypeId + '/'
})

CourseNotetype.plugin(plugin.modifyDate)
CourseNotetype.plugin(plugin.createDate)
CourseNotetype.plugin(plugin.absoluteUrl)
CourseNotetype.plugin(plugin.hits)

module.exports = mongoose.model('CourseNotetype', CourseNotetype)