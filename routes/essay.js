/*jslint node: true */
/*global app */
"use strict";

var _ = require('underscore')
var model = require('../model')

module.exports = function () {
  app.get('/:collegeSlug/:essaySlug', function (req, res, next) {
    var collegeSlug = req.params.collegeSlug
    var essaySlug = req.params.essaySlug

    var college = app.cache.colleges[collegeSlug]
    if (!college) return next()

    model.Essay
      .findOne({ collegeId: college._id, slug: essaySlug })
      .populate('userId')
      .exec(function (err, essay) {
        if (err) return next(err)
        if (!essay) return next()

        res.render('essay', {
          ads: true,
          breadcrumbs: [ college ],
          college: college,
          essay: essay,
          title: essay.name + ' - ' + college.name,
          url: essay.url
        })

        essay.hit()
      })
  })
}