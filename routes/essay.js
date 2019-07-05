var auto = require('run-auto')
var debug = require('debug')('studynotes:routes/essay')
var url = require('url')

var config = require('../config')
var insertNativeAd = require('../lib/insert-native-ad')
var model = require('../model')

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
          .select('-bodyTruncate')
          .populate('user')
          .exec(cb)
      },
      populateCollege: ['essay', function (r, cb) {
        var user = r.essay && r.essay.user
        if (user) {
          user.populate('college', cb)
        } else {
          cb()
        }
      }],
      essayCount: function (cb) {
        model.Essay.count({ published: true }).exec(cb)
      },
      essays: function (cb) {
        model.Essay
          .find({ college: college.id, published: true })
          .sort('-hits')
          .select('-prompt -body -bodyPaywall -bodyTruncate')
          .exec(cb)
      }
    }, function (err, r) {
      if (err) return next(err)
      if (!r.essay) return next()

      if (!(req.user && req.user.pro) && !req.query.free) {
        // They're a "first click free" user
        if (req.session.free === undefined) {
          debug('No first click free object, creating one')
          req.session.free = []
        } else {
          debug('First click free: ' + req.session.free.join(','))
        }

        if (req.session.free.indexOf(r.essay.id) === -1) {
          var referrer = url.parse(req.get('referer') || '').host // eslint-disable-line node/no-deprecated-api
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
      var len = r.essays.length

      r.prev = r.essays[index === 0 ? len - 1 : index - 1]
      r.next = r.essays[index === len - 1 ? 0 : index + 1]

      r.breadcrumbs = [
        { name: 'College Essays', url: '/essays/' }
      ]
      r.college = college
      r.title = [r.essay.name, college.shortName + ' Essay'].join(' - ')
      r.forceTitle = true
      r.url = r.essay.url
      r.user = r.essay.user

      if (!r.blur) {
        r.essay.body = insertNativeAd(r.essay.body, Object.assign({}, res.locals, app.locals))
      }

      res.render('essay', r)
      r.essay.hit()
    })
  })
}
