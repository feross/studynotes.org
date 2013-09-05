var _ = require('underscore')
var async = require('async')
var config = require('../config')
var mongoose = require('mongoose')
var once = require('once')
var Schema = mongoose.Schema

// Fields that are re-used many times
exports.SLUG = {
  type: String,
  match: /[-a-z0-9]+/i,
  lowercase: true
}
exports.SLUG_UNIQUE = _.extend({}, exports.SLUG, { unique: true })

exports.connect = function (cb) {
  cb = once(cb)
  mongoose.set('debug', !config.isProd)

  mongoose.connect('mongodb://' +
    config.db.user + '@' + config.db.host + ':' +
    config.db.port + '/' + config.db.database, {
      server: { poolSize: 20 }
  })
  mongoose.connection.on('error', cb)
  mongoose.connection.on('open', cb)
}

exports.Course = require('./Course')
exports.Notetype = require('./Notetype')
exports.Note = require('./Note')
exports.User = require('./User')


// Cache commonly accessed data
exports.cacheCourses = function (done) {
  app.cache = {}
  exports.Course.find(function (err, courses) {
    if (err) return done(err)

    app.cache.courses = {}
    async.forEach(courses, function (course, cb) {
      app.cache.courses[course.slug] = course

      course.populateNotetypes(cb)
    }, done)
  })
}
