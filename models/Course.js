var model = require('./')
var mongoose = require('mongoose')
var plugin = require('./plugin')

var Course = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  desc: String,
  slug: model.SLUG_UNIQUE,
  image: String,
  examDate: Date
})

Course.virtual('url').get(function() {
  return '/' + this.slug + '/'
})

Course.virtual('searchDesc').get(function () {
  return 'Course'
})

// TODO: remove this hack
Course.methods.getNotetypes = function (cb) {
  this.model('Notetype')
    .find({courseId: this.id})
    .sort('ordering')
    .exec(cb)
}

Course.plugin(plugin.modifyDate)
Course.plugin(plugin.createDate)
Course.plugin(plugin.absoluteUrl)
Course.plugin(plugin.slug)

module.exports = app.db.model('Course', Course)