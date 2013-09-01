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

  app.db = mongoose.createConnection('mongodb://' +
    config.db.user + '@' + config.db.host + ':' +
    config.db.port + '/' + config.db.database, {
      server: { poolSize: 20 }
  })

  app.db.Course = require('./Course')
  app.db.Notetype = require('./Notetype')
  app.db.Note = require('./Note')
  app.db.User = require('./User')

  app.db.on('error', cb)
  app.db.on('open', cb)
}

// Cache commonly accessed data
exports.warmCache = function (done) {
  app.db.cache = {}
  async.parallel({
    courses: function (cb) {
      app.db.Course.find(cb)
    },
    notetypes: function (cb) {
      app.db.Notetype.find(cb)
    }
  },
  function (err, results) {
    if (err) {
      done(err)
    } else {
      app.db.cache.courses = {}

      // TODO: remove this hack
      async.forEachSeries(results.courses, function (course, cb) {
        app.db.cache.courses[course.slug] = course

        course.getNotetypes(function (err, notetypes) {
          if (err) {
            console.error(err)
            done(err)
            return
          }
          course.notetypes = notetypes
          cb(null)
        })
      },
      function (err) {
        done(null)
      })
    }
  })
}
