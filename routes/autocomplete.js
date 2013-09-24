/*jslint node: true */
"use strict";

var search = require('../search')

module.exports = function (app) {
  app.get('/autocomplete', function (req, res, next) {
    var q = req.query.q

    search.autocomplete(q, function(err, results) {
      if (err) return next(err)
      // res.send(500, { error: 'Search error' })
      res.send({
        q: q,
        results: results
      })
    })
  })
}