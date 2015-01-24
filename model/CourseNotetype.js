var mongoose = require('mongoose')
var plugin = require('./plugin')

var CourseNotetype = mongoose.Schema({
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
  }
})

CourseNotetype.virtual('url').get(function () {
  var courseId = this.populated('course') || this.course
  var notetypeId = this.populated('notetype') || this.notetype

  return '/' + courseId + '/' + notetypeId + '/'
})

CourseNotetype.plugin(plugin.modifyDate)
CourseNotetype.plugin(plugin.createDate)
CourseNotetype.plugin(plugin.absoluteUrl)
CourseNotetype.plugin(plugin.hits)

module.exports = CourseNotetype
