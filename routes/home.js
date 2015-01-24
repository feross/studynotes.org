var auto = require('run-auto')
var countBy = require('lodash.countby')
var extend = require('extend.js')
var model = require('../model')
var sort = require('../lib/sort')

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
          .limit(Object.keys(model.cache.courses).length)
          .select('-body')
          .populate('course notetype')
          .exec(cb)
      },
      newEssays: function (cb) {
        model.Essay
          .find()
          .sort('-createDate')
          .limit(Object.keys(model.cache.collegesByName).length / 2)
          .select('-body -prompt')
          .populate('college')
          .exec(cb)
      },
      topUsers: function (cb) {
        auto({
          notes: function (cb2) {
            model.Note
              .find()
              .select('user -_id')
              .exec(cb2)
          },

          essays: function (cb2) {
            model.Essay
              .find()
              .select('user -_id')
              .exec(cb2)
          },

          topUsers: ['notes', 'essays', function (cb2, r) {
            var submissions = r.notes.concat(r.essays)
            var counts = countBy(submissions, function (s) { return s.user })
            var userIds = Object.keys(counts).sort(function (idA, idB) {
              return counts[idB] - counts[idA]
            })
            userIds = userIds.slice(0, 10)

            model.User
              .find({ _id: { $in: userIds } })
              .exec(function (err, users) {
                if (err) return cb2(err)

                users.forEach(function (user) {
                  user.submissionCount = counts[user.id]
                })

                users.sort(sort.byProp('submissionCount', true))

                cb2(null, users)
              })
          }]
        }, function (err, r) {
          if (err) return cb(err)
          cb(null, r.topUsers)
        })
      }
    }, function (err, r) {
      if (err) return next(err)

      var locals = {
        hero: {
          title: 'Study Notes',
          desc: 'Fast, free study guides. <span class="hide-mobile">Trusted <span class="totalHits animated small">millions of</span> times (and&nbsp;counting)</span>',
          descRaw: true,
          image: 'amjed.jpg'
          // desc: 'Fast, free study tools for AP students',
          // desc: 'The best AP study guides'
          // desc: 'Study tools for smart students'
          // desc: 'The secret to getting a 5 on the AP exam'
        },
        url: '/',
      }
      extend(locals, r)

      res.render('home', locals)
    })
  })
}
