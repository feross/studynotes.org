module.exports = function () {
  app.get('/search', function (req, res) {
    var q = req.query.q

    res.render('search', {
      url: '/search',
      title: 'Search Results for ' + q,
      search_term: q
    })
  })
}