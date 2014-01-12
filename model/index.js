var _ = require('underscore')
var async = require('async')
var config = require('../config')
var fs = require('fs')
var mongoose = require('mongoose')
var once = require('once')
var path = require('path')
var Schema = mongoose.Schema
var sort = require('../lib/sort')

// Object that contains the exported models, useful for iterating
// over *only* the models, skipping methods like `connect`.
exports.models = {}

// Set up each Schema in the /model folder
var files = fs.readdirSync(__dirname)
files.forEach(function (file) {
  var name = path.basename(file, '.js')
  if (name === 'index' || name === 'plugin') return

  // Set Schema options
  var schema = require('./' + name)
  schema.set('autoIndex', config.isProd) // no index during dev (slow)

  // Create Model object from Schema
  var model = mongoose.model(name, schema)

  // Export the Model
  exports[name] = exports.models[name] = model
})

exports.connect = function (cb) {
  cb || (cb = function () {})
  cb = once(cb)
  mongoose.set('debug', !config.isProd)

  mongoose.connect('mongodb://' +
    config.mongo.user + '@' + config.mongo.host + ':' +
    config.mongo.port + '/' + config.mongo.database, {
      server: { poolSize: 20 }
  })
  mongoose.connection.on('error', cb)
  mongoose.connection.on('open', function () {
    loadCache(cb)
  })
}

exports.cache = {}

function loadCache (done) {
  async.auto({
    courses: function (cb) {
      exports.Course
        .find()
        .sort('-hits')
        .populate('notetypes')
        .exec(cb)
    },
    colleges: function (cb) {
      exports.College
        .find()
        .sort('-hits')
        .exec(cb)
    }
  }, function (err, r) {
    if (err) return cb(err)

    exports.cache.courses = {}
    r.courses.forEach(function (course) {
      exports.cache.courses[course._id] = course
    })

    exports.cache.colleges = {}
    r.colleges.forEach(function (college) {
      exports.cache.colleges[college._id] = college
    })

    exports.cache.coursesByName = _(exports.cache.courses)
      .flatten()
      .sort(sort.byProp('name'))
    exports.cache.coursesByHits = _(exports.cache.courses)
      .flatten()
      .sort(sort.byProp('hits', true))
    exports.cache.collegesByName = _(exports.cache.colleges)
      .flatten()
      .sort(function (a, b) {
        if (a.id === 'common-app') return -1 // force common-app to sort first
        if (b.id === 'common-app') return 1
        return sort.byProp('name')(a, b)
      })
    exports.cache.collegesByRank = _(exports.cache.colleges)
      .flatten()
      .sort(sort.byProp('rank'))

    done(err)
  })
}
