var auto = require('run-auto')
var model = require('../model')
var parallel = require('run-parallel')

module.exports = function (app) {
  var tabs = [
    { name: 'Top College Essays', url: '/essays/', view: 'essays' },
    { name: 'Top Universities', url: '/colleges/', view: 'colleges' }
  ]

  app.get('/essays', function (req, res, next) {
    auto({
      essays: function (cb) {
        model.Essay
          .find({ published: true })
          .select('-prompt -body -bodyPaywall')
          .sort('-hits')
          .populate('college')
          .exec(cb)
      },
      collegeCount: function (cb) {
        model.College.countDocuments().exec(cb)
      }
    }, function (err, r) {
      if (err) return next(err)

      res.render('essays', {
        collegeCount: r.collegeCount,
        essays: r.essays,
        title: 'College Essays - Top ' + r.essays.length + ' Essays That Worked',
        forceTitle: true,
        url: '/essays/',
        hero: {
          title: 'College Admissions Essays',
          image: 'colleges.jpg',
          tabs: !req.isAuthenticated() || !req.user.pro
            ? tabs.concat({ name: 'Unlock All Essays', url: '/pro/' })
            : tabs
        }
      })
    })
  })

  app.get('/colleges', function (req, res, next) {
    var colleges = model.cache.collegesByRank
    model.Essay
      .countDocuments({ published: true })
      .exec(function (err, essayCount) {
        if (err) return next(err)

        res.render('colleges', {
          colleges: colleges,
          essayCount: essayCount,
          title: 'Top ' + colleges.length + ' Colleges',
          url: '/colleges/',
          hero: {
            title: 'Top Universities',
            tabs: !req.isAuthenticated() || !req.user.pro
              ? tabs.concat({ name: 'Unlock All Essays', url: '/pro/' })
              : tabs
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
          .find({ college: college.id, published: true })
          .select('-prompt -body -bodyPaywall -bodyTruncate')
          .sort('-hits')
          .exec(cb)
      }
    }, function (err, r) {
      var essays = r.essays
      if (err) return next(err)

      res.render('college-about', {
        breadcrumbs: [{ name: 'College Essays', url: '/essays/' }],
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
          .find({ college: college.id, published: true })
          .select('-prompt -body -bodyPaywall')
          .sort('-hits')
          .populate('user')
          .exec(cb)
      },
      populateColleges: ['essays', function (r, cb) {
        parallel(r.essays.map(function (essay) {
          return function (cb) {
            essay.user.populate('college', cb)
          }
        }), cb)
      }]
    }, function (err, r) {
      var essays = r.essays
      if (err) return next(err)

      res.render('college', {
        breadcrumbs: [{ name: 'College Essays', url: '/essays/' }],
        college: college,
        essays: essays,
        title: 'Top ' + essays.length + ' ' + college.shortName + ' Admissions Essays',
        url: college.url
      })

      college.hit()
    })
  })
}
