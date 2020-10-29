module.exports = function (app) {
  app.get('/search', function (req, res) {
    const q = req.query.q

    res.render('search', {
      url: '/search',
      title: 'Search Results for ' + q,
      searchTerm: q,
      hero: {
        title: 'Results for "' + q + '"',
        image: 'clouds.jpg'
      }
    })
  })
}
