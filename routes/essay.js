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
      // TODO: remove
      // populateUserCollege: ['essay', function (cb, results) {
      //   var essay = results.essay
      //   if (!essay) return next()

      //   essay.userId.populate('college', cb)
      // }]
    }, function (err, results) {
      var essay = results.essay
      var essays = results.essays
      if (err) return next(err)

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