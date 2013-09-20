/*jslint node: true */
/*global app */
"use strict";

var model = require('../model')

module.exports = function () {
  app.get('/user/:userSlug', function (req, res, next) {
    var userSlug = req.params.userSlug

    model.User
      .findOne({ slug: userSlug })
      .exec(function (err, theUser) {
        if (err) return next(err)
        if (!theUser) return next()

        res.render('user', {
          ads: true,
          theUser: theUser,
          title: theUser.name + '\'s Notes',
          url: theUser.url
        })

        theUser.hit()
      })
  })
}