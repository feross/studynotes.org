const model = require('../model')

module.exports = function (app) {
  app.get('/admin', async function (req, res, next) {
    if (!req.isAuthenticated() || !req.user.admin) return next()

    let essays, notes
    try {
      [essays, notes] = await Promise.all([
        model.Essay
          .find()
          .select('-prompt -body -bodyPaywall -bodyTruncate')
          .sort('-createDate'),
        model.Note
          .find()
          .select('-prompt -body -bodyTruncate')
          .sort('-createDate')
      ])
    } catch (err) {
      return next(err)
    }

    res.render('admin', {
      title: 'Study Notes Admin',
      url: '/admin',
      hero: {
        title: 'Study Notes Admin',
        image: 'open-source.jpg'
      },
      essays: essays,
      notes: notes
    })
  })

  app.post('/admin', async function (req, res, next) {
    if (!req.isAuthenticated() || !req.user.admin) return next()

    const Model = req.body.model === 'essay'
      ? model.Essay
      : model.Note

    try {
      const item = await Model.findOne({ _id: req.body.id })
      if (!item) return next(new Error('item not found'))

      const action = req.body.action

      if (action === 'publish' || action === 'unpublish') {
        item.published = (action === 'publish')
        await item.save()
      } else if (action === 'remove') {
        await item.deleteOne()
      } else {
        return next(new Error('Invalid action'))
      }
    } catch (err) {
      return next(err)
    }

    res.send({ err: null })
  })
}
