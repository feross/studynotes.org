var auto = require('run-auto')
var model = require('../model')

module.exports = function (app) {
  app.get('/admin', function (req, res, next) {
    // Admin-only page
    if (!req.isAuthenticated() || !req.user.admin) return next()

    auto({
      essays: function (cb) {
        model.Essay
          .find()
          .select('-prompt -body -bodyPaywall -bodyTruncate')
          .sort('-createDate')
          .exec(cb)
      },
      notes: function (cb) {
        model.Note
          .find()
          .select('-prompt -body -bodyTruncate')
          .sort('-createDate')
          .exec(cb)
      }
    }, function (err, r) {
      if (err) return next(err)

      res.render('admin', {
        title: 'Study Notes Admin',
        url: '/admin',
        hero: {
          title: 'Study Notes Admin',
          image: 'open-source.jpg'
        },
        essays: r.essays,
        notes: r.notes
      })
    })
  })
}
