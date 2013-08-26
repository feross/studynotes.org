var search = require('../search')

module.exports = function (app) {
  app.get('/autocomplete', function (req, res) {
    var q = req.query.q

    search.autocomplete(q, function(err, results){
      if (err) {
        console.error(err)
        res.send(500, { error: 'Search error' })
        return
      }
      res.send({
        q: q,
        results: results
      })
    })
  })
}