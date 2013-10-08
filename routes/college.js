/*jslint node: true */
"use strict";

var _ = require('underscore')
var async = require('async')
var model = require('../model')

module.exports = function (app) {
  var tabs = []
  // var tabs =  [
  //   { name: 'All Colleges', url: '/colleges/' },
  //   { name: 'All Essays', url: '/colleges/essays/' }
  // ]

  app.get('/colleges', function (req, res, next) {
    var colleges = _.flatten(model.cache.colleges)
    model.Essay
      .count()
      .exec(function (err, essayCount) {
        if (err) return next(err)

        res.render('colleges', {
          colleges: colleges,
          essayCount: essayCount,
          title: 'Elite College Admissions Essays',
          url: '/colleges/',
          hero: {
            title: 'Elite College Admissions Essays',
            desc: 'Learn from these essays that worked.',
            tabs: tabs
          }
        })
      })
  })

  app.get('/colleges/essays', function (req, res, next) {
    async.auto({
      essays: function (cb) {
        model.Essay
          .find()
          .populate('user college')
          .sort('-hits')
          .exec(cb)
      },
      collegeCount: function (cb) {
        model.College.count().exec(cb)
      }
    }, function (err, results) {
      if (err) return next(err)

      res.render('essays', {
        collegeCount: results.collegeCount,
        essays: results.essays,
        title: 'Sample Admissions Essays',
        url: '/colleges/essays/',
        hero: {
          title: 'Elite College Admissions Essays',
          desc: 'Learn from these essays that worked.',
          image: 'colleges.jpg',
          tabs: tabs
        }
      })
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
        // breadcrumbs: [ { name: 'College Essays', url: '/colleges/essays/' } ],
        college: college,
        essays: essays,
        title: 'Sample ' + college.shortName + ' Admissions Essays',
        url: college.url
      })

      college.hit()
    })
  })
}