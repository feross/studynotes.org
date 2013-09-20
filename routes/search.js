/*jslint node: true */
/*global app */
"use strict";

module.exports = function () {
  app.get('/search', function (req, res) {
    var q = req.query.q

    res.render('search', {
      url: '/search',
      title: 'Search Results for ' + q,
      searchTerm: q,
      hero: {
        title: 'Search Results for "' + q + '"'
      }
    })
  })
}