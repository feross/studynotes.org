const model = require('../model')

module.exports = function (app) {
  const tabs = [
    { name: 'Top College Essays', url: '/essays/', view: 'essays' },
    { name: 'Top Universities', url: '/colleges/', view: 'colleges' }
  ]

  app.get('/essays', async function (req, res, next) {
    let essays, collegeCount
    try {
      [essays, collegeCount] = await Promise.all([
        model.Essay
          .find({ published: true })
          .select('-prompt -body -bodyPaywall')
          .sort('-hits')
          .populate('college'),
        model.College.countDocuments()
      ])
    } catch (err) {
      return next(err)
    }

    res.render('essays', {
      collegeCount: collegeCount,
      essays: essays,
      title: 'College Essays - Top ' + essays.length + ' Essays That Worked',
      forceTitle: true,
      url: '/essays/',
      hero: {
        title: 'College Admissions Essays',
        image: 'colleges.jpg',
        tabs: tabs
      }
    })
  })

  app.get('/colleges', async function (req, res, next) {
    const colleges = model.cache.collegesByRank
    let essayCount
    try {
      essayCount = await model.Essay.countDocuments({ published: true })
    } catch (err) {
      return next(err)
    }

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

  app.get('/:collegeId/about', async function (req, res, next) {
    const college = model.cache.colleges[req.params.collegeId]
    if (!college) return next()

    let essays
    try {
      essays = await model.Essay
        .find({ college: college.id, published: true })
        .select('-prompt -body -bodyPaywall -bodyTruncate')
        .sort('-hits')
    } catch (err) {
      return next(err)
    }

    res.render('college-about', {
      breadcrumbs: [{ name: 'College Essays', url: '/essays/' }],
      college: college,
      essays: essays,
      title: 'About ' + college.name,
      url: college.url + 'about/'
    })

    college.hit()
  })

  app.get('/:collegeId', async function (req, res, next) {
    const college = model.cache.colleges[req.params.collegeId]
    if (!college) return next()

    let essays
    try {
      essays = await model.Essay
        .find({ college: college.id, published: true })
        .select('-prompt -body -bodyPaywall')
        .sort('-hits')
        .populate('user')
      await Promise.all(essays.map(function (essay) {
        return essay.user && essay.user.populate('college')
      }))
    } catch (err) {
      return next(err)
    }

    res.render('college', {
      breadcrumbs: [{ name: 'College Essays', url: '/essays/' }],
      college: college,
      essays: essays,
      title: 'Top ' + essays.length + ' ' + college.shortName + ' Admissions Essays',
      url: college.url
    })

    college.hit()
  })
}
