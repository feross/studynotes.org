const mongoose = require('mongoose')
const plugin = require('./plugin')

const CourseNotetype = new mongoose.Schema({
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
  const courseId = this.populated('course') || this.course
  const notetypeId = this.populated('notetype') || this.notetype

  return '/' + courseId + '/' + notetypeId + '/'
})

CourseNotetype.plugin(plugin.modifyDate)
CourseNotetype.plugin(plugin.createDate)
CourseNotetype.plugin(plugin.absoluteUrl)
CourseNotetype.plugin(plugin.hits)

module.exports = CourseNotetype
