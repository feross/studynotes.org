/*jslint node: true */
"use strict";

var _ = require('underscore')
var async = require('async')
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

  app.get('/:collegeId', function (req, res, next) {
    var collegeId = req.params.collegeId

    var college = model.cache.colleges[collegeId]
    if (!college) return next()

    async.auto({
      essays: function (cb) {
        model.Essay
          .find({ college: college.id })
          .populate('user')
          .sort('-hits')
          .limit(20)
          .exec(cb)
      },
      populateColleges: ['essays', function (cb, results) {
        async.each(results.essays, function (essay, cb2) {
          essay.user.populate('college', cb2)
        }, cb)
      }]
    }, function (err, results) {
        var essays = results.essays
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