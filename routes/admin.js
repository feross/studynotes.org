var auto = require('run-auto')
var model = require('../model')

module.exports = function (app) {
  app.get('/admin', function (req, res, next) {
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

  app.post('/admin', function (req, res, next) {
    if (!req.isAuthenticated() || !req.user.admin) return next()

    var Model = req.body.model === 'essay'
      ? model.Essay
      : model.Note

    Model
      .findOne({ _id: req.body.id })
      .exec(function (err, item) {
        if (err) return next(err)
        if (!item) return next(new Error('item not found'))

        var action = req.body.action

        if (action === 'publish' || action === 'unpublish') {
          item.published = (action === 'publish')
          item.save(function (err) {
            if (err) return next(err)
            res.send({ err: null })
          })
        } else if (action === 'remove') {
          item.remove(function (err) {
            if (err) return next(err)
            res.send({ err: null })
          })
        } else {
          return next(new Error('Invalid action'))
        }
      })
  })
}
