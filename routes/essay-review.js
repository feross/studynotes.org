module.exports = function (app) {
  app.get('/essay-review', function (req, res, next) {
    res.render('essay-review', {
      title: 'College Essay Review and Editing',
      url: '/essay-review',
      hero: {
        title: 'College Application Essay Editing',
        image: 'students.jpg'
      },
      cls: 'landing-page'
    })
  })

  app.get('/essay-review-success', function (req, res, next) {
    // TODO: redirect to /essay-review/ if user hasn't actually purchased a review

    res.render('essay-review-success', {
      title: 'College Essay Review and Editing',
      url: '/essay-review',
      hero: {
        title: 'College Application Essay Review',
        image: 'students.jpg'
      }
    })
  })
}
