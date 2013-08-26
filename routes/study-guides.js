module.exports = function (app) {
  app.get('/study-guides', function (req, res) {
    res.render('study-guides', {
      url: '/study-guides',
      title: 'Buy Amazon.com AP Study Guides',
      hero: {
        title: 'Learn yourself some good AP stuffs',
        desc: '^ Maybe start with AP English'
      }
    })
  })
}