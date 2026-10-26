const insertNativeAd = require('../lib/insert-native-ad')
const model = require('../model')

module.exports = function (app) {
  app.get('/:collegeId/:essayId', async function (req, res, next) {
    const college = model.cache.colleges[req.params.collegeId]
    if (!college) return next()

    const r = {}
    try {
      [r.essay, r.essays] = await Promise.all([
        getEssay(),
        model.Essay
          .find({ college: college.id, published: true })
          .sort('-hits')
          .select('-prompt -body -bodyPaywall -bodyTruncate')
      ])
    } catch (err) {
      return next(err)
    }
    if (!r.essay) return next()

    if (req.query.edit) {
      req.flash('essay', r.essay)
      return res.redirect('/submit/essay/')
    }

    let index
    r.essays.forEach(function (e, i) {
      if (e.id === r.essay.id) index = i
    })
    const len = r.essays.length

    r.prev = r.essays[index === 0 ? len - 1 : index - 1]
    r.next = r.essays[index === len - 1 ? 0 : index + 1]

    r.breadcrumbs = [
      { name: 'College Essays', url: '/essays/' }
    ]
    r.college = college
    r.title = [r.essay.name, college.shortName + ' Essay'].join(' - ')
    r.forceTitle = true
    r.url = r.essay.url
    r.user = r.essay.user

    r.essay.body = insertNativeAd(r.essay.body, Object.assign({}, res.locals, app.locals))

    res.render('essay', r)
    r.essay.hit()

    async function getEssay () {
      const essay = await model.Essay
        .findOne({
          college: college.id,
          _id: req.params.essayId
        })
        .select('-bodyTruncate')
        .populate('user')
      if (essay && essay.user) await essay.user.populate('college')
      return essay
    }
  })
}
