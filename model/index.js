var auto = require('run-auto')
var config = require('../config')
var fs = require('fs')
var mongoose = require('mongoose')
var once = require('once')
var path = require('path')
var secret = require('../config')
var sort = require('../lib/sort')
var values = require('object-values')

// Object that contains the exported models, useful for iterating
// over *only* the models, skipping methods like `connect`.
var models = exports.models = {}

var cache = exports.cache = {}

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
  exports[name] = models[name] = model
})

exports.connect = function (cb) {
  cb || (cb = function () {})
  cb = once(cb)
  mongoose.set('debug', !config.isProd)

  mongoose.connect(
    'mongodb://' +
    secret.mongo.user + '@' + secret.mongo.host + ':' +
    secret.mongo.port + '/' + secret.mongo.database,
    { server: { poolSize: 20 } }
  )
  mongoose.connection.on('error', cb)
  mongoose.connection.on('open', function () {
    loadCache(cb)
  })
}

function loadCache (done) {
  auto({
    courses: function (cb) {
      models.Course
        .find()
        .populate('notetypes')
        .exec(cb)
    },
    colleges: function (cb) {
      models.College
        .find()
        .exec(cb)
    }
  }, function (err, r) {
    if (err) return done(err)

    cache.courses = {}
    r.courses.forEach(function (course) {
      cache.courses[course._id] = course
    })

    cache.colleges = {}
    r.colleges.forEach(function (college) {
      cache.colleges[college._id] = college
    })
    cache.coursesByName = values(cache.courses).sort(sort.byProp('name'))
    cache.coursesByHits = values(cache.courses).sort(sort.byProp('hits', true))
    cache.collegesByName = values(cache.colleges).sort(function (a, b) {
      // force common-app to sort first
      if (a.id === 'common-app') return -1
      if (b.id === 'common-app') return 1
      return sort.byProp('name')(a, b)
    })
    cache.collegesByShortName = values(cache.colleges).sort(function (a, b) {
      // force common-app to sort first
      if (a.id === 'common-app') return -1
      if (b.id === 'common-app') return 1
      return sort.byProp('shortName')(a, b)
    })
    cache.collegesByRank = values(cache.colleges).sort(sort.byProp('rank'))

    done(err)
  })
}
