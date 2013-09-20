/*jslint node: true */
/*global app */
"use strict";

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
  lowercase: true,
  index: true
}
exports.SLUG_UNIQUE = {
  type: String,
  match: /[-a-z0-9]+/i,
  lowercase: true,
  unique: true
}

exports.Course = require('./Course')
exports.Notetype = require('./Notetype')
exports.Note = require('./Note')
exports.User = require('./User')
exports.College = require('./College')
exports.Essay = require('./Essay')

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
  mongoose.connection.on('open', cb)
}

exports.loadCache = function (done) {
  app.cache = {}

  async.parallel([
    function (cb) {
      exports.Course
        .find()
        .sort('-hits')
        .exec(function (err, courses) {
          if (err) return cb(err)
          app.cache.courses = {}
          async.forEach(courses, function (course, cb2) {
            app.cache.courses[course.slug] = course
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
          app.cache.colleges = {}
          colleges.forEach(function (college) {
            app.cache.colleges[college.slug] = college
          })
          cb(null)
        })
    }
  ], done)
}
