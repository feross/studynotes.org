var _ = require('underscore')
var auth = require('../auth')

module.exports = function () {
  app.get('/submit/essay', auth.ensureAuth, function (req, res, next) {
    var colleges = _(app.cache.colleges).flatten()
    res.render('submit', {
      colleges: colleges,
      hero: {
        title: 'Submit an essay',
        desc: 'Only college admissions essays (for now)'
      },
      title: 'Submit a college essay',
      url: '/submit/essay',
      searchFocus: false
    })
  })

  app.post('/submit/essay', auth.ensureAuth, function (req, res, next) {

  })
}