/*jslint node: true */
"use strict";

var _ = require('underscore')
var async = require('async')
var model = require('../model')

module.exports = function (app) {
  app.get('/:courseId/:notetypeId', function (req, res, next) {
    var course = model.cache.courses[req.params.courseId]
    if (!course) return next()

    var notetype = _.find(course.notetypes, function (n) {
      return n.id === req.params.notetypeId
    })
    if (!notetype) return next()

    async.auto({
      notes: function (cb) {
        model.Note
          .find({ course: course.id, notetype: notetype.id })
          .select('-body')
          .sort('ordering')
          .exec(cb)
      },
      courseNotetype: function (cb) {
        model.CourseNotetype
          .findOne({ course: course.id, notetype: notetype.id })
          .exec(cb)
      }
    }, function (err, results) {
      if (err) return next(err)
      var notes = results.notes
      var courseNotetype = results.courseNotetype

      if (!courseNotetype) {
        courseNotetype = new model.CourseNotetype({
          course: course.id,
          notetype: notetype.id
        })
        courseNotetype.save(function (err) {
          if (err) next(err)
        })
      }

      res.render('notetype', {
        ads: true,
        breadcrumbs: [ course ],
        course: course,
        notetype: notetype,
        courseNotetype: courseNotetype,
        notes: notes,
        title: course.name + ' ' + notetype.name,
        url: courseNotetype.url
      })

      courseNotetype.hit()
    })
  })
}