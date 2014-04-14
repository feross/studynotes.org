var _ = require('underscore')
var async = require('async') // TODO: remove
var auto = require('run-auto')
var model = require('../model')

module.exports = function (app) {
  var tabs = [
    { name: 'Top College Essays', url: '/essays/', view: 'essays' },
    { name: 'Top Universities', url: '/colleges/', view: 'colleges' }
  ]

  app.get('/essays', function (req, res, next) {
    auto({
      essays: function (cb) {
        model.Essay
          .find()
          .select('-prompt')
          .sort('-hits')
          .populate('user college')
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
        title: 'College Essays - Top ' + results.essays.length + ' Essays That Worked',
        forceTitle: true,
        url: '/essays/',
        hero: {
          title: 'College Admissions Essays',
          image: 'colleges.jpg',
          tabs: tabs
        }
      })
    })
  })

  app.get('/colleges', function (req, res, next) {
    var colleges = model.cache.collegesByRank
    model.Essay
      .count()
      .exec(function (err, essayCount) {
        if (err) return next(err)

        res.render('colleges', {
          colleges: colleges,
          essayCount: essayCount,
          title: 'Top ' + colleges.length + ' Colleges',
          url: '/colleges/',
          hero: {
            title: 'Top Universities',
            tabs: tabs
          }
        })
      })
  })

  app.get('/:collegeId/about', function (req, res, next) {
    var college = model.cache.colleges[req.params.collegeId]
    if (!college) return next()

    auto({
      essays: function (cb) {
        model.Essay
          .find({ college: college.id })
          .select('-body -prompt')
          .sort('-hits')
          .exec(cb)
      }
    }, function (err, results) {
      var essays = results.essays
      if (err) return next(err)

      res.render('college-about', {
        breadcrumbs: [ { name: 'College Essays', url: '/essays/' } ],
        college: college,
        essays: essays,
        title: 'About ' + college.name,
        url: college.url + 'about/'
      })

      college.hit()
    })
  })

  app.get('/:collegeId', function (req, res, next) {
    var college = model.cache.colleges[req.params.collegeId]
    if (!college) return next()

    auto({
      essays: function (cb) {
        model.Essay
          .find({ college: college.id })
          .select('-prompt')
          .sort('-hits')
          .populate('user')
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
        breadcrumbs: [ { name: 'College Essays', url: '/essays/' } ],
        college: college,
        essays: essays,
        title: 'Top ' + essays.length + ' ' + college.shortName + ' Admissions Essays',
        url: college.url
      })

      college.hit()
    })
  })

}