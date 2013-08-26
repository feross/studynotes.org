module.exports = function (app) {
  app.get('/about', function (req, res) {
    res.render('about', {
      url: '/about',
      title: 'About',
      hero: {
        title: 'Say Hello to StudyNotes!',
        desc: 'Fast, free study tools for AP* students'
      }
    })
  })
}