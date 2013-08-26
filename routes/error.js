var config = require('../config')
var express = require('express')

module.exports = function (app) {
  // 404 page
  app.use(function(req, res) {
    res.render('404', {
      title: '404: Page not Found'
    })
  })

}