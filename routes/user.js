/*jslint node: true */
"use strict";

var _ = require('underscore')
var async = require('async')
var model = require('../model')

module.exports = function (app) {
  app.get('/user/:userId', function (req, res, next) {
    async.auto({
      user: function (cb) {
        model.User
          .findOne({ _id: req.params.userId })
          .populate('college')
          .exec(cb)
      },
      essays: ['user', function (cb, results) {
        var user = results.user
        if (!user) return next()

        model.Essay
          .find({ user: user._id, anon: false })
          .populate('college')
          .select('-body -prompt')
          .exec(cb)
      }]
    }, function (err, results) {
      if (err) return next(err)

      var user = results.user
      var essays = results.essays

      var totalHits = _(essays).reduce(function (total, essay) {
        return essay.hits + total
      }, 0)

      res.render('user', {
        essays: essays,
        hero: {
          title: user.name,
          desc: 'Notes, Essays, and StudyNotes contributions'
        },
        title: user.name + '\'s Notes and Essays',
        totalHits: totalHits,
        url: user.url,
        user: user
      })

      user.hit()

    })
  })
}