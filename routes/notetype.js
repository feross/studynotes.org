/*jslint node: true */
"use strict";

var _ = require('underscore')
var async = require('async')
var model = require('../model')
var sort = require('../lib/sort')

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
        var query = model.Note
          .find({ course: course.id, notetype: notetype.id })
          .sort('ordering -hits')

        if (notetype.id == 'sample-essays') {
          query.populate('user')
        } else {
          query.select('-body')
        }

        query.exec(cb)
      },
      courseNotetype: function (cb) {
        model.CourseNotetype
          .findOne({ course: course.id, notetype: notetype.id })
          .exec(function (err, courseNotetype) {
            if (err) return cb(err)

            if (courseNotetype) {
              cb(null, courseNotetype)
            } else {
              courseNotetype = new model.CourseNotetype({
                course: course.id,
                notetype: notetype.id
              })
              courseNotetype.save(function (err) {
                cb(err, courseNotetype)
              })
            }
          })
      }
    }, function (err, results) {
      if (err) return next(err)
      var notes = results.notes
      var courseNotetype = results.courseNotetype

      var view = 'notetype'
      if (notetype.id === 'sample-essays') view = 'notetype-sample-essays'

      if (notetype.hasChapters) {
        notes.sort(sort.sortChapters)
      }

      res.render(view, {
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