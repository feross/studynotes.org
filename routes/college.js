var _ = require('underscore')
var model = require('../model')

module.exports = function () {
  app.get('/colleges', function (req, res, next) {
    var colleges = _.flatten(app.cache.colleges)
    res.render('colleges', {
      ads: true,
      colleges: colleges,
      title: 'Elite College Essays',
      url: '/colleges',
      hero: {
        title: 'Elite College Essays',
        desc: 'Get into a top college! Learn from these essays.'
      }
    })
  })

  app.get('/:collegeSlug', function (req, res, next) {
    var collegeSlug = req.params.collegeSlug

    var college = app.cache.colleges[collegeSlug]
    if (!college) return next()

    res.render('college', {
      ads: true,
      college: college,
      title: college.name,
      url: college.url
    })

    college.hit()
  })
}