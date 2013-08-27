var _ = require('underscore')
var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')

var Notetype = mongoose.Schema({
  name: { type: String, required: true },
  singularName: String,
  shortDesc: String,
  desc: String,
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  ordering: Number,
  slug: model.SLUG
})

Notetype.index({ courseId: 1, slug: 1 }, { unique: true })
Notetype.index({ courseId: 1 })

Notetype.virtual('url').get(function() {
  var self = this
  course = _.find(app.db.cache.courses, function (c){
    return c.id == self.courseId.toString()
  })

  return '/' + course.slug + '/' + this.slug + '/'
})

Notetype.plugin(plugin.modifyDate)
Notetype.plugin(plugin.createDate)
Notetype.plugin(plugin.slug)
Notetype.plugin(plugin.absoluteUrl)

module.exports = app.db.model('Notetype', Notetype)