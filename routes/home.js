module.exports = function () {
  app.get('/', function (req, res) {
    res.render('home', {
      ads: true,
      url: '/',
      hero: {
        title: 'Study Notes',
        desc: 'Fast, free study tools for AP* students'
        // desc: 'The best AP* study guides'
        // desc: 'Study tools for smart students'
        // desc: 'The secret to getting a 5 on the AP* exam'
      }
    })
  })
}