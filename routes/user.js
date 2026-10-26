const model = require('../model')

module.exports = function (app) {
  app.get('/user/:userId', async function (req, res, next) {
    let user, essays, notes
    try {
      [user, essays, notes] = await Promise.all([
        model.User
          .findOne({ _id: req.params.userId })
          .populate('college'),
        model.Essay
          .find({ user: req.params.userId, anon: false, published: true })
          .select('-prompt -body -bodyPaywall')
          .sort('-hits')
          .populate('college'),
        model.Note
          .find({ user: req.params.userId, anon: false, published: true })
          .select('-body -bodyTruncate')
          .sort('-hits')
          .populate('course')
      ])
    } catch (err) {
      return next(err)
    }
    if (!user) return next()

    const essayHits = essays.reduce(function (total, essay) {
      return total + essay.hits
    }, 0)
    const totalHits = notes.reduce(function (total, note) {
      return total + note.hits
    }, essayHits)

    res.render('user', {
      essays: essays,
      notes: notes,
      hero: {
        title: user.name,
        image: 'books.jpg'
      },
      title: user.name + '\'s Notes and Essays',
      totalHits: totalHits,
      url: user.url,
      user: user
    })

    user.hit()
  })
}
