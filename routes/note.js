var _ = require('underscore')
var heroForCourse = require('./course').hero

module.exports = function () {
  app.get('/:courseSlug/:notetypeSlug/:noteSlug', function (req, res, next) {
    var courseSlug = req.params.courseSlug
    var notetypeSlug = req.params.notetypeSlug
    var noteSlug = req.params.noteSlug

    var course = app.db.cache.courses[courseSlug]
    if (!course) return next()

    var notetype = _.find(course.notetypes, function (n) {
      return n.slug === notetypeSlug
    })
    if (!notetype) return next()

    app.db.Note
    .find({ courseId: course._id, notetypeId: notetype._id })
    .sort('ordering')
    .exec(function (err, notes){
      if (err) return next(err)
      if (!notes) return next(new Error('Unable to load notes'))

      var note = _.find(notes, function (n) {
        return n.slug === noteSlug
      })
      if (!note) return next()

      var noteOrdering = note.ordering

      var noteNext = _.find(notes, function (note){
        return note.ordering === noteOrdering + 1
      })

      var notePrev = _.find(notes, function (note){
        return note.ordering === noteOrdering - 1
      })

      // Async update hit count
      note.update({ $inc: { hits: 1 } }, { upsert: true }, function () {})

      res.render('note', {
        breadcrumbs: [
          { name: course.name, url: course.url },
          { name: notetype.name, url: notetype.url }
        ],
        cls: 'course-' + course.slug,
        course: course,
        hero: heroForCourse(course),
        note: note,
        noteNext: noteNext,
        notePrev: notePrev,
        notetype: notetype,
        relatedNotes: notes,
        title: [note.name, course.name + ' ' + notetype.name].join(' - '),
        url: note.url
      })
    })
  })
}