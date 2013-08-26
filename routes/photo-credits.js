module.exports = function () {
  app.get('/photo-credits', function (req, res) {
    res.render('photo-credits', {
      url: '/photo-credits',
      title: 'Photo Credits',
      hero: {
        title: 'Photo Credits'
      }
    })
  })
}