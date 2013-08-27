var _ = require('underscore')
var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')

var Note = mongoose.Schema({
  name: { type: String, required: true, index: true },
  body: { type: String, required: true },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  notetypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notetype',
    required: true
  },
  ordering: Number,
  slug: model.SLUG
})

// No duplicate names or slugs for a course+notetype
Note.index({ courseId: 1, notetypeId: 1, slug: 1 }, { unique: true })
Note.index({ courseId: 1, notetypeId: 1, name: 1 }, { unique: true })

Note.index({ courseId: 1, notetypeId: 1})

Note.virtual('url').get(function () {
  var courseId = this.courseId.toString()
  var notetypeId = this.notetypeId.toString()

  course = _.find(app.db.cache.courses, function (c){
    return c.id == courseId
  })
  notetype = _.find(course.notetypes, function (n){
    return n.id == notetypeId
  })

  return '/' + course.slug + '/' + notetype.slug + '/' + this.slug + '/'
})

Note.virtual('searchDesc').get(function () {
  var courseId = this.courseId.toString()
    , notetypeId = this.notetypeId.toString()

  course = _.find(app.db.cache.courses, function (c){
    return c.id == courseId
  })
  notetype = _.find(course.notetypes, function (n){
    return n.id == notetypeId
  })

  return course.name + ' ' + (notetype.singularName || notetype.name)
})

Note.plugin(plugin.modifyDate)
Note.plugin(plugin.createDate)
Note.plugin(plugin.absoluteUrl)
Note.plugin(plugin.slug)
Note.plugin(plugin.hits)

module.exports = app.db.model('Note', Note)