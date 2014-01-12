var _ = require('underscore')
var async = require('async')
var model = require('../model')

module.exports = function (app) {
  app.get('/:collegeId/:essayId', function (req, res, next) {
    var college = model.cache.colleges[req.params.collegeId]
    if (!college) return next()

    async.auto({
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
      essays: function (cb) {
        model.Essay
          .find({ college: college.id })
          .sort('-hits')
          .select('-body -prompt')
          .exec(cb)
      }
    }, function (err, results) {
      var essays = results.essays
      var essay = results.essay

      if (err) return next(err)
      if (!essay) return next()

      if (req.query.edit) {
        req.flash('essay', essay)
        return res.redirect('/submit/essay/')
      }

      var index
      essays.forEach(function (e, i) {
        if (e.id === essay.id) index = i
      })

      var prevEssay
      var nextEssay
      if (index > 0) {
        prevEssay = essays[index - 1]
      }
      if (index < essays.length - 1) {
        nextEssay = essays[index + 1]
      }

      res.render('essay', {
        breadcrumbs: [
          { name: 'College Essays', url: '/essays/' },
          college
        ],
        college: college,
        essay: essay,
        essays: essays,
        next: nextEssay,
        prev: prevEssay,
        title: [essay.name, college.shortName + ' Essay'].join(' - '),
        forceTitle: true,
        url: essay.url,
        user: essay.user
      })

      essay.hit()
    })
  })
}