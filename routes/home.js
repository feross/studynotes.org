var auto = require('run-auto')
var extend = require('xtend/mutable')
var model = require('../model')

module.exports = function (app) {
  app.get('/', function (req, res, next) {
    auto({
      noteCount: function (cb) {
        model.Note.count().exec(cb)
      },
      courseCount: function (cb) {
        model.Course.count().exec(cb)
      },
      essayCount: function (cb) {
        model.Essay.count().exec(cb)
      },
      collegeCount: function (cb) {
        model.College.count().exec(cb)
      },
      userCount: function (cb) {
        model.User.count().exec(cb)
      },
      newNotes: function (cb) {
        model.Note
          .find()
          .sort('-createDate')
          .limit(5)
          .select('-body')
          .populate('course notetype')
          .exec(cb)
      },
      newEssays: function (cb) {
        model.Essay
          .find()
          .sort('-createDate')
          .limit(5)
          .select('-body -prompt')
          .populate('college')
          .exec(cb)
      }
    }, function (err, r) {
      if (err) return next(err)

      var locals = {
        hero: {
          title: 'Study Notes',
          desc: 'Fast, free study guides. <span class="hide-mobile">Trusted <span class="totalHits small">millions of</span> times (and&nbsp;counting)</span>',
          descRaw: true,
          image: 'amjed.jpg'
          // desc: 'Fast, free study tools for AP students',
          // desc: 'The best AP study guides'
          // desc: 'Study tools for smart students'
          // desc: 'The secret to getting a 5 on the AP exam'
        },
        url: '/'
      }
      extend(locals, r)

      res.render('home', locals)
    })
  })
}
