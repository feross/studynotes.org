const model = require('../model')
const sort = require('../lib/sort')

module.exports = function (app) {
  app.get('/:courseId/:notetypeId', async function (req, res, next) {
    const course = model.cache.courses[req.params.courseId]
    if (!course) return next()

    const notetype = course.notetypes.filter(function (n) {
      return n.id === req.params.notetypeId
    })[0]
    if (!notetype) return next()

    let notes, courseNotetype
    try {
      [notes, courseNotetype] = await Promise.all([
        getNotes(),
        getCourseNotetype()
      ])
    } catch (err) {
      return next(err)
    }

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

    function getNotes () {
      const query = model.Note
        .find({ course: course.id, notetype: notetype.id, published: true })
        .sort('ordering -hits')
        .select('-body')

      if (notetype.id === 'sample-essays') {
        query.populate('user')
      } else {
        query.select('-bodyTruncate')
      }

      return query.exec()
    }

    async function getCourseNotetype () {
      let courseNotetype = await model.CourseNotetype
        .findOne({ course: course.id, notetype: notetype.id })

      if (!courseNotetype) {
        courseNotetype = new model.CourseNotetype({
          course: course.id,
          notetype: notetype.id
        })
        await courseNotetype.save()
      }
      return courseNotetype
    }
  })
}
