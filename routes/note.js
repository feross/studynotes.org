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
          .find({ course: course.id, notetype: notetype.id, published: true })
          .sort('ordering -hits')
          .select('-body -bodyTruncate')
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
    }, function (err, r) {
      if (err) return next(err)
      if (!r.note) return next()

      if (req.query.edit) {
        req.flash('note', r.note)
        return res.redirect('/submit/note/')
      }

      if (notetype.hasChapters) {
        r.notes.sort(sort.sortChapters)
      }

      var index
      r.notes.forEach(function (n, i) {
        if (n.id === r.note.id) index = i
      })
      var len = r.notes.length

      r.prev = r.notes[ index === 0 ? len - 1 : index - 1 ]
      r.next = r.notes[ index === len - 1 ? 0 : index + 1 ]

      r.course = course
      r.notetype = notetype
      r.title = [ r.note.name, course.name + ' ' + notetype.name ].join(' - ')
      r.url = r.note.url
      r.seenSurvey = Boolean(req.cookies.seen_survey)

      res.render('note', r)
      r.note.hit()
    })
  })
}
