/*jslint node: true */
/*global app */
"use strict";

var _ = require('underscore')
var async = require('async')
var model = require('../model')

module.exports = function () {
  app.get('/:collegeSlug/:essaySlug', function (req, res, next) {
    var collegeSlug = req.params.collegeSlug
    var essaySlug = req.params.essaySlug

    var college = app.cache.colleges[collegeSlug]
    if (!college) return next()

    async.auto({
      essay: function (cb) {
        model.Essay
          .findOne({ collegeId: college._id, slug: essaySlug })
          .populate('userId')
          .exec(cb)
      },
      essays: function (cb) {
        model.Essay
          .find({ collegeId: college._id })
          .sort('-hits')
          .select('-body -prompt')
          .exec(cb)
      },
      populateUserCollege: ['essay', function (cb, results) {
        var essay = results.essay
        if (!essay) return next()

        essay.userId.populate('collegeId', cb)
      }]
    }, function (err, results) {
      var essay = results.essay
      var essays = results.essays
      if (err) return next(err)

      var index
      essays.forEach(function (e, i) {
        if (e.id === essay.id) index = i
      })

      if (index > 0) {
        var prevEssay = essays[index - 1]
      }
      if (index < essays.length - 1) {
        var nextEssay = essays[index + 1]
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
        user: essay.userId
      })

      essay.hit()
    })
  })
}