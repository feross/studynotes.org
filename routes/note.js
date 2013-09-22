/*jslint node: true */
/*global app */
"use strict";

var _ = require('underscore')
var async = require('async')
var model = require('../model')

module.exports = function () {
  app.get('/:courseSlug/:notetypeSlug/:noteSlug', function (req, res, next) {
    var courseSlug = req.params.courseSlug
    var notetypeSlug = req.params.notetypeSlug
    var noteSlug = req.params.noteSlug

    var course = app.cache.courses[courseSlug]
    if (!course) return next()

    var notetype = _.find(course.notetypes, function (n) {
      return n.slug === notetypeSlug
    })
    if (!notetype) return next()

    async.parallel({
      notes: function (cb) {
        model.Note
          .find({ courseId: course._id, notetypeId: notetype._id })
          .sort('ordering')
          .select('-body')
          .exec(cb)
      },
      note: function (cb) {
        model.Note
          .findOne({
            courseId: course._id,
            notetypeId: notetype._id,
            slug: noteSlug
          })
          .exec(cb)
      }
    }, function (err, results) {
      if (err) return next(err)
      var notes = results.notes
      var note = results.note

      if (!note) return next()

      var nextNote = _.find(notes, function (n) {
        return n.ordering === note.ordering + 1
      })
      var prevNote = _.find(notes, function (n) {
        return n.ordering === note.ordering - 1
      })

      res.render('note', {
        ads: true,
        breadcrumbs: [ course, notetype ],
        course: course,
        note: note,
        next: nextNote,
        prev: prevNote,
        notetype: notetype,
        relatedNotes: notes,
        title: [note.name, course.name + ' ' + notetype.name].join(' - '),
        url: note.url
      })

      note.hit()

    })
  })
}