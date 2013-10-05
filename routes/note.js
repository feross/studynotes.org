/*jslint node: true */
"use strict";

var _ = require('underscore')
var async = require('async')
var model = require('../model')

module.exports = function (app) {
  app.get('/:courseId/:notetypeId/:noteId', function (req, res, next) {

    var course = model.cache.courses[req.params.courseId]
    if (!course) return next()

    var notetype = _.find(course.notetypes, function (n) {
      return n.id === req.params.notetypeId
    })
    if (!notetype) return next()

    async.parallel({
      notes: function (cb) {
        model.Note
          .find({ course: course.id, notetype: notetype.id })
          .sort('ordering')
          .select('-body')
          .exec(cb)
      },
      note: function (cb) {
        model.Note
          .findOne({
            course: course.id,
            notetype: notetype.id,
            _id: req.params.noteId
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