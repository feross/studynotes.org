var config = require('../config')
var express = require('express')

module.exports = function (app) {
  // 404 page
  app.use(function(req, res) {
    res.render('not-found', {
      title: '404: Page Not Found',
      hero: {
        title: 'Cat Not Found',
        desc: '(404 Page Not Found)'
      }
    })
  })

}