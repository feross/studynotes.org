var _ = require('underscore')
var async = require('async')
var model = require('../model')
var util = require('../util')

module.exports = function (app) {
  app.get('/', function (req, res, next) {
    async.auto({
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
        async.auto({
          notes: function (cb2) {
            model.Note
              .find()
              .select('user')
              .exec(cb2)
          },

          essays: function (cb2) {
            model.Essay
              .find()
              .select('user')
              .exec(cb2)
          },

          topUsers: ['notes', 'essays', function (cb2, r) {
            var submissions = r.notes.concat(r.essays)
            var counts = _.countBy(submissions, function (s) { return s.user })
            var userIds = _.sortBy(Object.keys(counts), function (k) {
              return -1 * counts[k]
            })
            userIds = userIds.slice(0, 10)

            model.User
              .find({ _id: { $in: userIds } })
              .exec(function (err, users) {
                if (err) return cb2(err)
                users = _.indexBy(users, '_id')

                var sortedUsers = userIds.map(function (id) {
                  var user = users[id]
                  user.submissionCount = counts[id]
                  return user
                })
                cb2(null, sortedUsers)
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
      util.extend(locals, r)

      res.render('home', locals)
    })
  })
}