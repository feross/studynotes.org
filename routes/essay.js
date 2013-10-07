/*jslint node: true */
"use strict";

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
          .populate('user user.college')
          .exec(cb)
      },
      essays: function (cb) {
        model.Essay
          .find({ college: college.id })
          .sort('-hits')
          .select('-body -prompt')
          .exec(cb)
      }
    }, function (err, results) {
      if (err) return next(err)
      var essays = results.essays
      var essay = results.essay
      if (!essay) return next()

      var index
      essays.forEach(function (e, i) {
        if (e._id === essay._id) index = i
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
        ads: true,
        breadcrumbs: [ college ],
        college: college,
        essay: essay,
        next: nextEssay,
        prev: prevEssay,
        title: essay.name + ' - ' + college.name,
        url: essay.url,
        user: essay.user
      })

      essay.hit()
    })
  })
}