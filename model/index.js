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

// Fields that are re-used many times
// TODO: REMOVE
exports.SLUG = {
  type: String,
  match: /[-a-z0-9]+/i,
  lowercase: true,
  index: true
}
exports.SLUG_UNIQUE = {
  type: String,
  match: /[-a-z0-9]+/i,
  lowercase: true,
  unique: true
}

// Object that contains the exported models, useful for iterating
// over *only* the models, skipping methods like `connect`.
exports.models = {}

// Export all models in /model folder
var files = fs.readdirSync(__dirname)
files.forEach(function (file) {
  var name = path.basename(file, '.js')
  if (name === 'index' || name === 'plugin') return
  exports[name] = exports.models[name] = require('./' + name)
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
        .exec(function (err, courses) {
          if (err) return cb(err)
          exports.cache.courses = {}
          async.forEach(courses, function (course, cb2) {
            exports.cache.courses[course.slug] = course
            course.populateNotetypes(cb2)
          }, cb)
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
            exports.cache.colleges[college.slug] = college
          })
          cb(null)
        })
    }
  ], function (err) {

    function sortByName (a, b) {
      if(a.name < b.name) return -1
      if(a.name > b.name) return 1
      return 0
    }
    exports.cache.coursesArray = _(exports.cache.courses)
      .flatten()
      .sort(sortByName)
    exports.cache.collegesArray = _(exports.cache.colleges)
      .flatten()
      .sort(sortByName)

    done(err)
  })
}
