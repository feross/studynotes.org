/*jslint node: true */
"use strict";

var async = require('async')
var model = require('../model')
var util = require('../util')

module.exports = function (app) {
  app.get('/', function (req, res, next) {
    async.auto({
      noteCount: function (cb) {
        model.Note.count().exec(cb)
      },
      courseCount: function (cb) {
        model.Course.count().exec(cb)
      },
      essayCount: function (cb) {
        model.Essay.count().exec(cb)
      },
      collegeCount: function (cb) {
        model.College.count().exec(cb)
      },
      userCount: function (cb) {
        model.User.count().exec(cb)
      },
      newNotes: function (cb) {
        model.Note
          .find()
          .sort('created')
          .limit(10)
          .select('-body')
          .populate('course notetype')
          .exec(cb)
      }
    }, function (err, results) {
      if (err) return next(err)

      var locals = {
        hero: {
          title: 'Study Notes',
          desc: 'Fast, free study tools for AP* students'
          // desc: 'The best AP* study guides'
          // desc: 'Study tools for smart students'
          // desc: 'The secret to getting a 5 on the AP* exam'
        },
        url: '/',
      }
      util.extend(locals, results)

      res.render('home', locals)
    })
  })
}