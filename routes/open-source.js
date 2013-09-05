module.exports = function () {
  app.get('/open-source', function (req, res) {
    res.render('open-source', {
      url: '/open-source',
      title: 'Open Source',
      hero: {
        title: 'Powered by Open Source',
        desc: 'Free and open, the way all software should be.'
      }
    })
  })
}