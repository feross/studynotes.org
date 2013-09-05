var config = require('../config')
var express = require('express')
var path = require('path')
var randomquote = require('../randomquote')
var util = require('../util')

module.exports = function () {
  /*
   * Adds variables that all templates will expect.
   */
  var render = app.render
  app.render = function (view, opts, fn) {
    // Set default template local variables
    opts.cls || (opts.cls = '')
    opts.courses || (opts.courses = app.cache.courses)
    opts.randomquote || (opts.randomquote = randomquote())
    opts.searchTerm || (opts.searchTerm = '')

    if (opts.url) {
      // Make URL absolute
      opts.url = config.siteOrigin + opts.url

      // Force trailing slashes in URL
      if (opts.url[opts.url.length - 1] !== '/') {
        opts.url += '/'
      }
    }

    // Add view name as class on <body>
    opts.cls += ' ' + view

    // If we're rendering a view that is related to a course, then add a
    // relevant class to <body>
    if (opts.course) {
      opts.cls += ' course-' + opts.course.slug
    }

    // If we're rendering a view that is related to a course, let's set the
    // hero text
    if (opts.course) {
      opts.hero = {
        desc: 'Class Notes, Test Prep, Review Materials, and More',
        tabs: opts.course.notetypes,
        title: opts.course.name,
        url: opts.course.url
      }
    }

    // Call the original express render function
    render.call(app, view, opts, fn)
  }

  require('./home')()
  require('./study-guides')()

  // Static
  require('./about')()
  require('./contact')()
  require('./plagiarism')()
  require('./privacy')()
  require('./photo-credits')()
  require('./open-source')()

  // Search
  require('./search')()
  require('./autocomplete')()

  // Dynamic
  require('./course')()
  require('./notetype')()
  require('./note')()
  require('./signup')()
  require('./login')()

  // Error pages
  require('./error')()
}