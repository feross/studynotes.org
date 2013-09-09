var _ = require('underscore')
var model = require('../model')

module.exports = function () {
  app.get('/courses', function (req, res, next) {
    var courses = _.flatten(app.cache.courses)
    res.render('courses', {
      ads: true,
      courses: courses,
      title: 'AP Courses',
      url: '/courses',
      hero: {
        title: 'AP Courses',
        desc: 'Which AP class do you want to study for?'
      }
    })
  })
}