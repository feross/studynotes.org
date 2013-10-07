/*jslint node: true */
"use strict";

var _ = require('underscore')
var auth = require('../auth')
var model = require('../model')

module.exports = function (app) {
  app.get('/submit/essay', auth.ensureAuth, function (req, res, next) {
    res.render('submit-essay', {
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
    var college = model.cache.colleges[req.body.college]
    if (!college) {
      req.flash('error', 'Please select a university from the list.')
      req.flash('essay', req.body)
      return res.redirect('/submit/essay/')
    }

    var essay = new model.Essay({
      name: req.body.name,
      prompt: req.body.prompt,
      body: req.body.body,
      college: college._id,
      user: req.user._id,
      anon: !!req.body.anon
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

    app.get('/submit/note', auth.ensureAuth, function (req, res, next) {
    res.render('submit-note', {
      hero: {
        title: 'Add a note to StudyNotes',
        desc: 'Help future generations of AP students. Share your notes.'
      },
      title: 'Submit a note',
      url: '/submit/note',
      searchFocus: false,

      note: req.flash('note')[0],
      errors: req.flash('error')
    })
  })

  app.post('/submit/note', auth.ensureAuth, function (req, res, next) {
    var course = model.cache.courses[req.body.course]
    if (!course) {
      req.flash('error', 'Please select a course from the list.')
      req.flash('note', req.body)
      return res.redirect('/submit/note/')
    }
    var notetype = _(course.notetypes).find(function (n) {
      return n.slug === req.body.notetype
    })
    if (!notetype) {
      req.flash('error', 'Please select a note type from the list.')
      req.flash('note', req.body)
      return res.redirect('/submit/note/')
    }

    var note = new model.Note({
      name: req.body.name,
      body: req.body.body,
      courseId: course.id,
      notetypeId: notetype.id,
      userId: req.user.id
    })
    note.save(function (err) {
      if (err && err.name === 'ValidationError') {
        _(err.errors).map(function (error) {
          req.flash('error', error.type)
        })
        req.flash('note', req.body)
        res.redirect('/submit/note/')
      } else if (err) {
        next(err)
      } else {
        res.redirect(note.url)
      }
    })
  })
}