module.exports = function () {
  app.get('/contact', function (req, res) {
    res.render('contact', {
      url: '/contact',
      title: 'Contact Us',
      hero: {
        title: 'Contact Us',
        desc: 'We\'d love to hear from you!'
      }
    })
  })
}