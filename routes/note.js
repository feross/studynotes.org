var model = require('../model')
var parallel = require('run-parallel')
var sort = require('../lib/sort')

module.exports = function (app) {
  app.get('/:courseId/:notetypeId/:noteId', function (req, res, next) {
    var course = model.cache.courses[req.params.courseId]
    if (!course) return next()

    var notetype = course.notetypes.filter(function (n) {
      return n.id === req.params.notetypeId
    })[0]
    if (!notetype) return next()

    parallel({
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
      var notes = results.notes
      var note = results.note

      if (err) return next(err)
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
