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
      populateUserCollege: ['essay', function (cb, results) {
        var essay = results.essay
        if (!essay) return next()

        essay.userId.populate('collegeId', cb)
      }]
    }, function (err, results) {
      var essay = results.essay
      if (err) return next(err)

      res.render('essay', {
        ads: true,
        breadcrumbs: [ college ],
        college: college,
        essay: essay,
        title: essay.name + ' - ' + college.name,
        url: essay.url,
        user: essay.userId
      })

      essay.hit()
    })
  })
}