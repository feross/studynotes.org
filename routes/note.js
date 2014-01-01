/*jslint node: true */

var _ = require('underscore')
var async = require('async')
var model = require('../model')
var sort = require('../lib/sort')

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
          .sort('ordering -hits')
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

      if (req.query.edit) {
        req.flash('note', note)
        return res.redirect('/submit/note/')
      }

      if (notetype.hasChapters) {
        notes.sort(sort.sortChapters)
      }

      var index
      notes.forEach(function (n, i) {
        if (n.id === note.id) index = i
      })

      var prevNote
      var nextNote
      if (index > 0) {
        prevNote = notes[index - 1]
      }
      if (index < notes.length - 1) {
        nextNote = notes[index + 1]
      }

      res.render('note', {
        breadcrumbs: [ course, {
          name: notetype.name,
          url: course.notetypeUrl(notetype)
        } ],
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