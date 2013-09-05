var model = require('../model')

module.exports = function () {
  app.get('/user/:userSlug', function (req, res, next) {
    var userSlug = req.params.userSlug

    model.User
      .findOne({ slug: userSlug })
      .exec(function (err, user) {
        if (err) return next(err)
        if (!user) return next()

        res.render('user', {
          user: user,
          title: user.name + '\'s Notes',
          url: user.url
        })

        user.hit()
      })
  })
}