var _ = require('underscore')
var async = require('async')
var model = require('../model')

module.exports = function (app) {
  app.get('/user/:userId', function (req, res, next) {
    async.auto({
      user: function (cb) {
        model.User
          .findOne({ _id: req.params.userId })
          .populate('college')
          .exec(cb)
      },
      essays: function (cb) {
        model.Essay
          .find({ user: req.params.userId, anon: false })
          .select('-prompt')
          .sort('-hits')
          .populate('college')
          .exec(cb)
      },
      notes: function (cb) {
        model.Note
          .find({ user: req.params.userId, anon: false })
          .select('-body')
          .sort('-hits')
          .populate('course')
          .exec(cb)
      }
    }, function (err, r) {
      if (err) return next(err)
      if (!r.user) return next()

      var essayHits = _(r.essays).reduce(function (total, essay) {
        return total + essay.hits
      }, 0)
      var totalHits = _(r.notes).reduce(function (total, note) {
        return total + note.hits
      }, essayHits)

      res.render('user', {
        essays: r.essays,
        notes: r.notes,
        hero: {
          title: r.user.name,
          image: 'books.jpg'
        },
        title: r.user.name + '\'s Notes and Essays',
        totalHits: totalHits,
        url: r.user.url,
        user: r.user
      })

      r.user.hit()

    })
  })
}