var auth = require('../auth')

module.exports = function () {
  app.get('/submit/essay', auth.ensureAuth, function (req, res, next) {
    res.render('submit', {
      hero: {
        title: 'Upload an essay',
        desc: 'Only college admissions essays (for now)'
      },
      title: 'Upload a college essay',
      url: '/submit/essay',
    })
  })
}