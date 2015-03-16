var auto = require('run-auto')
var config = require('../config')
var debug = require('debug')('studynotes:routes/essay')
var model = require('../model')
var url = require('url')

module.exports = function (app) {
  app.get('/:collegeId/:essayId', function (req, res, next) {
    var college = model.cache.colleges[req.params.collegeId]
    if (!college) return next()

    auto({
      essay: function (cb) {
        model.Essay
          .findOne({
            college: college.id,
            _id: req.params.essayId
          })
          .populate('user')
          .exec(cb)
      },
      populateCollege: ['essay', function (cb, results) {
        var user = results.essay && results.essay.user
        if (user) {
          user.populate('college', cb)
        } else {
          cb()
        }
      }],
      essayCount: function (cb) {
        model.Essay.count().exec(cb)
      },
      essays: function (cb) {
        model.Essay
          .find({ college: college.id })
          .sort('-hits')
          .select('-body -prompt')
          .exec(cb)
      }
    }, function (err, r) {
      if (err) return next(err)
      if (!r.essay) return next()

      if (!(req.user && req.user.pro)) {
        // They're a "first click free" user
        if (req.session.free === undefined) {
          debug('No first click free object, creating one')
          req.session.free = []
        } else {
          debug('First click free: ' + req.session.free.join(','))
        }

        if (req.session.free.indexOf(r.essay.id) === -1) {
          var referrer = url.parse(req.get('referer') || '').host
          if (req.session.free.length < config.numFree ||
              (referrer && referrer.search(config.siteHost) === -1)) {
            req.session.free.push(r.essay.id)
          } else {
            r.blur = true
          }
        }
      }

      if (req.query.edit) {
        req.flash('essay', r.essay)
        return res.redirect('/submit/essay/')
      }

      var index
      r.essays.forEach(function (e, i) {
        if (e.id === r.essay.id) index = i
      })

      if (index > 0) r.prev = r.essays[index - 1]
      if (index < r.essays.length - 1) r.next = r.essays[index + 1]

      r.breadcrumbs = [
        { name: 'College Essays', url: '/essays/' },
        college
      ]
      r.college = college
      r.title = [r.essay.name, college.shortName + ' Essay'].join(' - ')
      r.forceTitle = true
      r.url = r.essay.url
      r.user = r.essay.user

      res.render('essay', r)
      r.essay.hit()
    })
  })
}
