var config = require('../config')
var express = require('express')
var path = require('path')
var randomquote = require('../randomquote')
var util = require('../util')

module.exports = function (app) {
  /*
   * Adds variables that all templates will expect.
   */
  var render = app.render
  app.render = function (view, options, fn) {
    options.ads || (options.ads = config.isProd)
    options.cls || (options.cls = '')
    options.courses || (options.courses = m.cache.courses)
    options.randomquote || (options.randomquote = randomquote())
    options.search_term || (options.search_term = '')

    // Add view name as class on <body>
    options.cls += ' ' + view

    if (options.url) {
      // Make absolute
      options.url = config.siteOrigin + options.url

      // Force trailing slashes in URLs
      if (options.url[options.url.length - 1] !== '/') {
        options.url += '/'
      }
    }

    render.call(app, view, options, fn)
  }

  require('./home')(app)
  require('./study-guides')(app)
  require('./about')(app)
  require('./contact')(app)
  require('./plagiarism')(app)
  require('./privacy')(app)
  require('./photo-credits')(app)
  require('./search')(app)
  require('./autocomplete')(app)
  require('./course')(app)
  require('./notetype')(app)
  require('./note')(app)

  if (!config.isProd) {
    // Server static resources in dev (nginx handles it in prod)
    app.use(express.static(path.join(config.root, 'static')))
  }

  // Error pages
  require('./error')(app)
}