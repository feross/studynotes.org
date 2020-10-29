const auto = require('run-auto')
const extend = require('xtend/mutable')
const model = require('../model')

module.exports = function (app) {
  app.get('/', function (req, res, next) {
    auto({
      noteCount: function (cb) {
        model.Note.countDocuments({ published: true }).exec(cb)
      },
      courseCount: function (cb) {
        model.Course.countDocuments().exec(cb)
      },
      essayCount: function (cb) {
        model.Essay.countDocuments({ published: true }).exec(cb)
      },
      collegeCount: function (cb) {
        model.College.countDocuments().exec(cb)
      },
      userCount: function (cb) {
        model.User.countDocuments().exec(cb)
      },
      newNotes: function (cb) {
        model.Note
          .find({ published: true })
          .sort('-createDate')
          .limit(5)
          .select('-body -bodyTruncate')
          .populate('course notetype')
          .exec(cb)
      },
      newEssays: function (cb) {
        model.Essay
          .find({ published: true })
          .sort('-createDate')
          .limit(5)
          .select('-prompt -body -bodyPaywall -bodyTruncate')
          .populate('college')
          .exec(cb)
      }
    }, function (err, r) {
      if (err) return next(err)

      const locals = {
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
