/*jslint node: true */
/*global app */
"use strict";

var _ = require('underscore')
var auth = require('../auth')
var model = require('../model')

module.exports = function () {
  app.get('/submit/essay', auth.ensureAuth, function (req, res, next) {
    res.render('submit', {
      hero: {
        title: 'Add an essay to StudyNotes',
        desc: 'Help everyone write a powerful essay, regardless of their background.'
      },
      title: 'Submit an essay',
      url: '/submit/essay',
      searchFocus: false,

      essay: req.flash('essay')[0],
      errors: req.flash('error')
    })
  })

  app.post('/submit/essay', auth.ensureAuth, function (req, res, next) {
    var college = app.cache.colleges[req.body.college]
    if (!college) {
      req.flash('error', 'Please select a university from the list.')
      req.flash('essay', req.body)
      return res.redirect('/submit/essay/')
    }
    var essay = new model.Essay({
      name: req.body.name,
      prompt: req.body.prompt,
      body: req.body.body,
      collegeId: college._id,
      userId: req.user._id
    })
    essay.save(function (err) {
      if (err && err.name === 'ValidationError') {
        _(err.errors).map(function (error) {
          req.flash('error', error.type)
        })
        req.flash('essay', req.body)
        res.redirect('/submit/essay/')
      } else if (err) {
        next(err)
      } else {
        res.redirect(essay.url)
      }
    })
  })
}