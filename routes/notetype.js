var _ = require('underscore')
var heroForCourse = require('./course').hero

module.exports = function () {
  app.get('/:courseSlug/:notetypeSlug', function (req, res, next) {
    var courseSlug = req.params.courseSlug
    var notetypeSlug = req.params.notetypeSlug

    var course = app.db.cache.courses[courseSlug]
    if (!course) return next()

    var notetype = _.find(course.notetypes, function (n) {
      return n.slug === notetypeSlug
    })
    if (!notetype) return next()

    app.db.Note
    .find({ courseId: course._id, notetypeId: notetype._id })
    .sort('ordering')
    .exec(function (err, notes) {
      if (err) return next(err)
      if (!notes) return next(new Error('Unable to load notes'))

      res.render('notetype', {
        breadcrumbs: [
          { name: course.name, url: course.url }
        ],
        cls: 'course-' + course.slug,
        course: course,
        hero: heroForCourse(course),
        notetype: notetype,
        notes: notes,
        url: notetype.url,
        title: course.name + ' ' + notetype.name
      })
    })
  })
}