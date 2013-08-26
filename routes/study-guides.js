module.exports = function () {
  app.get('/study-guides', function (req, res) {
    res.render('study-guides', {
      url: '/study-guides',
      title: 'Buy Amazon.com AP Study Guides',
      hero: {
        title: 'Book Store',
        desc: 'Get extra help with study guides from Amazon.com'
      }
    })
  })
}