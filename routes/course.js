var async = require('async')
var model = require('../model')

module.exports = function () {
  app.get('/:courseSlug', function (req, res, next) {
    var courseSlug = req.params.courseSlug

    var course = app.cache.courses[courseSlug]
    if (!course) return next()

    res.render('course', {
      course: course,
      title: course.name,
      url: course.url
    })
  })
}