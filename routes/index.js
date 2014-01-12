var config = require('../config')
var express = require('express')
var path = require('path')
var randomquote = require('../lib/randomquote')
var util = require('../util')

module.exports = function (app) {
  /*
   * Adds variables that all templates will expect.
   */
  var render = app.render
  app.render = function (view, opts, fn) {
    // Set default template local variables
    opts.view = view
    opts.cls || (opts.cls = '')
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

    // If rendering a course-related view
    if (opts.course) {
      var tabs = opts.course.notetypes.map(function (notetype) {
        return {
          on: notetype.id === (opts.notetype && opts.notetype.id),
          name: notetype.name,
          url: opts.course.notetypeUrl(notetype)
        }
      })

      opts.hero = {
        desc: 'Class Notes, Test Prep, Review Materials, and More',
        image: opts.course.heroImage,
        tabs: tabs,
        title: opts.course.name,
        url: opts.course.url
      }
    }
    // If rendering a college-related view
    else if (opts.college && opts.essays) {
      opts.hero = {
        // desc: 'College Essays That Worked',
        image: opts.college.heroImage,
        tabs: [
          {
            name: opts.college.shortName + ' Essays',
            url: opts.college.url,
            view: ['college', 'essay']
          },
          {
            name: 'About ' + opts.college.shortName,
            url: opts.college.url + 'about/',
            view: 'college-about'
          }
        ],
        title: opts.college.shortName + ' Admissions Essays',
        url: opts.college.url
      }
    }
    // If rendering any other type of view and heroImage is missing
    else if (opts.hero && !opts.hero.image) {
      opts.hero.image = view + '.jpg'
    }

    // Add view name as class on <body>
    opts.cls += ' ' + view

    // If no hero is on the page, set a special class on <body>
    if (!opts.hero) {
      opts.cls += ' solidHeader'
    }

    // Call the original express render function
    return render.call(this, view, opts, fn)
  }

  require('./home')(app)
  require('./static')(app)

  // Accounts
  require('./signup')(app)
  require('./login')(app)

  // Submit
  require('./submit')(app)

  // Search
  require('./search')(app)
  require('./autocomplete')(app)

  // Dynamic
  require('./course')(app)
  require('./notetype')(app)
  require('./note')(app)
  require('./college')(app)
  require('./essay')(app)
  require('./user')(app)

  // Error pages
  require('./error')(app)
}