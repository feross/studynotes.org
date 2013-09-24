/*jslint node: true */
"use strict";

var _ = require('underscore')
var model = require('../model')

module.exports = function (app) {
  app.get('/colleges', function (req, res, next) {
    var colleges = _.flatten(model.cache.colleges)
    res.render('colleges', {
      colleges: colleges,
      title: 'Elite College Admissions Essays',
      url: '/colleges',
      hero: {
        title: 'Elite College Admissions Essays',
        desc: 'Learn from these essays that worked.'
      }
    })
  })

  app.get('/:collegeSlug', function (req, res, next) {
    var collegeSlug = req.params.collegeSlug

    var college = model.cache.colleges[collegeSlug]
    if (!college) return next()

    model.Essay
      .find({ collegeId: college._id })
      .select('-body')
      .sort('-hits')
      .populate('userId')
      .exec(function (err, essays) {
        if (err) return next(err)
        res.render('college', {
          ads: true,
          college: college,
          essays: essays,
          title: 'Sample ' + college.shortName + ' Admissions Essays',
          url: college.url
        })

        college.hit()
      })
  })
}