/*jslint node: true */
"use strict";

var _ = require('underscore')
var model = require('../model')

module.exports = function (app) {
  app.get('/courses', function (req, res, next) {
    var courses = _.flatten(model.cache.courses)
    res.render('courses', {
      courses: courses,
      title: 'AP Courses',
      url: '/courses',
      hero: {
        title: 'AP Courses',
        desc: 'Which AP class do you want to study for?'
      }
    })
  })

  app.get('/:courseSlug', function (req, res, next) {
    var courseSlug = req.params.courseSlug

    var course = model.cache.courses[courseSlug]
    if (!course) return next()

    res.render('course', {
      ads: true,
      course: course,
      title: course.name,
      url: course.url
    })

    course.hit()
  })
}