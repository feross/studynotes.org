var search = require('../lib/search')

module.exports = function (app) {
  app.get('/autocomplete', function (req, res, next) {
    var q = req.query.q

    search.autocomplete(q, function(err, results) {
      if (err) return next(err)
      res.send({
        q: q,
        results: results
      })
    })
  })
}