const model = require('../model')

module.exports = function (app) {
  app.get('/courses', function (req, res) {
    const courses = Object.values(model.cache.courses)
    res.render('courses', {
      courses: courses,
      title: 'AP Courses',
      url: '/courses',
      hero: {
        title: 'AP Courses',
        desc: 'Which AP class do you want to study for?',
        image: 'leaves.jpg'
      }
    })
  })

  app.get('/:courseId', function (req, res, next) {
    const course = model.cache.courses[req.params.courseId]
    if (!course) return next()

    res.render('course', {
      course: course,
      title: course.name,
      url: course.url
    })

    course.hit()
  })
}
