var auto = require('run-auto')
var model = require('../model')
var sort = require('../lib/sort')

module.exports = function (app) {
  app.get('/:courseId/:notetypeId', function (req, res, next) {
    var course = model.cache.courses[req.params.courseId]
    if (!course) return next()

    var notetype = course.notetypes.filter(function (n) {
      return n.id === req.params.notetypeId
    })[0]
    if (!notetype) return next()

    auto({
      notes: function (cb) {
        var query = model.Note
          .find({ course: course.id, notetype: notetype.id, published: true })
          .sort('ordering -hits')
          .select('-body')

        if (notetype.id === 'sample-essays') {
          query.populate('user')
        } else {
          query.select('-bodyTruncate')
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

      if (notetype.hasChapters) {
        notes.sort(sort.sortChapters)
      }

      res.render('notetype', {
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
