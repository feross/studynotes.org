var _ = require('underscore')
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

    model.Note
      .find({ courseId: course._id, notetypeId: notetype._id })
      .sort('ordering')
      .exec(function (err, notes) {
        if (err) return next(err)

        var note = _.find(notes, function (n) {
          return n.slug === noteSlug
        })
        if (!note) return next()

        var noteOrdering = note.ordering

        var nextNote = _.find(notes, function (note) {
          return note.ordering === noteOrdering + 1
        })

        var prevNote = _.find(notes, function (note) {
          return note.ordering === noteOrdering - 1
        })

        res.render('note', {
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

        // Update hit count, asyncronously
        note.update({ $inc: { hits: 1 } }, { upsert: true }, function () {})
      })
  })
}