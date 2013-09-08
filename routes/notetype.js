var _ = require('underscore')
var model = require('../model')

module.exports = function () {
  app.get('/:courseSlug/:notetypeSlug', function (req, res, next) {
    var courseSlug = req.params.courseSlug
    var notetypeSlug = req.params.notetypeSlug

    var course = app.cache.courses[courseSlug]
    if (!course) return next()

    var notetype = _.find(course.notetypes, function (n) {
      return n.slug === notetypeSlug
    })
    if (!notetype) return next()

    model.Note
      .find({ courseId: course._id, notetypeId: notetype._id })
      .select('-body')
      .sort('ordering')
      .exec(function (err, notes) {
        if (err) return next(err)

        res.render('notetype', {
          ads: true,
          breadcrumbs: [ course ],
          course: course,
          notetype: notetype,
          notes: notes,
          title: course.name + ' ' + notetype.name,
          url: notetype.url
        })

        notetype.hit()
      })
  })
}