var search = require('./search')

module.exports = function () {
  app.get('/:courseSlug', function (req, res, next) {
    var courseSlug = req.params.courseSlug

    var course = m.cache.courses[courseSlug]
    if (!course) return next()

    res.render('course', {
      cls: 'course-' + course.slug,
      course: course,
      hero: module.exports.hero(course),
      notetypes: course.notetypes,
      url: course.url,
      title: course.name
    })
  })
}

module.exports.hero = function (course) {
  return {
    title: course.name,
    desc: 'Class Notes, Test Prep, Review Materials, and More',
    url: course.url,
    tabs: course.notetypes
  }
}