/*jslint node: true */
"use strict";

var async = require('async')
var model = require('../model')

module.exports = function (app) {
  app.get('/', function (req, res, next) {
    async.auto({
      noteCount: function (cb) {
        model.Note.count().exec(cb)
      },
      essayCount: function (cb) {
        model.Essay.count().exec(cb)
      }
    }, function (err, r) {
      if (err) return next(err)

      res.render('home', {
        essayCount: r.essayCount,
        hero: {
          title: 'Study Notes',
          desc: 'Fast, free study tools for AP* students'
          // desc: 'The best AP* study guides'
          // desc: 'Study tools for smart students'
          // desc: 'The secret to getting a 5 on the AP* exam'
        },
        noteCount: r.noteCount,
        url: '/',
      })
    })
  })
}