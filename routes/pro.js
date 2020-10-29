const auto = require('run-auto')
const model = require('../model')

module.exports = function (app) {
  app.get('/pro/:collegeId?', function (req, res, next) {
    // Send pro users to the essays page
    if (req.isAuthenticated() && req.user.pro) {
      return res.redirect('/essays/')
    }

    const college = model.cache.colleges[req.params.collegeId]
    if (!college && req.params.collegeId) return next()

    auto({
      essays: function (cb) {
        model.Essay
          .find({ published: true })
          .select('-prompt -body -bodyPaywall -bodyTruncate')
          .populate('college')
          .sort('-hits')
          .exec(cb)
      }
    }, function (err, r) {
      if (err) return next(err)
      const heroTitle = college
        ? college.shortName + ' Essays that Worked'
        : 'College Essays that Worked'

      const heroImage = college
        ? college.id + '.jpg'
        : 'amjed.jpg'

      const collegeEssays = college
        ? r.essays.filter((e) => e.college.id === college.id)
        : r.essays
      const otherEssays = college
        ? r.essays.filter((e) => e.college.id !== college.id)
        : r.essays

      const otherColleges = college
        ? model.cache.collegesByRank.filter((c) => c.id !== college.id)
        : model.cache.collegesByRank

      let collegeList, collegeListAnd
      if (!college || college.id === 'stanford' || college.id === 'common-app') {
        collegeList = 'Stanford, Harvard, Princeton'
        collegeListAnd = 'Stanford, Harvard, and Princeton'
      } else if (college.id === 'harvard') {
        collegeList = 'Harvard, Stanford, Princeton'
        collegeListAnd = 'Harvard, Stanford, and Princeton'
      } else {
        collegeList = college.shortName + ', Stanford, Harvard'
        collegeListAnd = college.shortName + ', Stanford, and Harvard'
      }

      const title = college
        ? college.shortName + ' Essays that Worked'
        : 'College Essays that Worked'

      res.render('pro', {
        title: title,
        url: '/pro/' + (college ? college.id : ''),
        hero: {
          title: heroTitle,
          image: heroImage
        },
        cls: 'landing-page',
        college: college,
        collegeEssays: collegeEssays,
        collegeList: collegeList,
        collegeListAnd: collegeListAnd,
        essays: r.essays,
        otherColleges: otherColleges,
        otherEssays: otherEssays
      })
    })
  })
}
