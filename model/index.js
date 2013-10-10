/*jslint node: true */
"use strict";

var _ = require('underscore')
var async = require('async')
var config = require('../config')
var fs = require('fs')
var mongoose = require('mongoose')
var once = require('once')
var path = require('path')
var Schema = mongoose.Schema

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
  async.parallel([
    function (cb) {
      exports.Course
        .find()
        .sort('-hits')
        .populate('notetypes')
        .exec(function (err, courses) {
          if (err) return cb(err)
          exports.cache.courses = {}
          courses.forEach(function (course) {
            exports.cache.courses[course._id] = course
          })
          cb(null)
        })
    },
    function (cb) {
      exports.College
        .find()
        .sort('-hits')
        .exec(function (err, colleges) {
          if (err) return cb(err)
          exports.cache.colleges = {}
          colleges.forEach(function (college) {
            exports.cache.colleges[college._id] = college
          })
          cb(null)
        })
    }
  ], function (err) {
    function sortByName (a, b) {
      if (a.name < b.name) return -1
      if (a.name > b.name) return 1
      return 0
    }
    function sortByRank (a, b) {
      if (a.rank < b.rank) return -1
      if (a.rank > b.rank) return 1
      return 0
    }
    exports.cache.coursesByName = _(exports.cache.courses)
      .flatten()
      .sort(sortByName)
    exports.cache.collegesByName = _(exports.cache.colleges)
      .flatten()
      .sort(function (a, b) {
        if (a.id === 'common-app') return -1 // force common-app to sort first
        if (b.id === 'common-app') return 1
        return sortByName(a, b)
      })
    exports.cache.collegesByRank = _(exports.cache.colleges)
      .flatten()
      .sort(sortByRank)

    done(err)
  })
}
