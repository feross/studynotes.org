var config = require('../config')
var express = require('express')

module.exports = function () {
  app.use(function(req, res) {
    res.render('error', {
      title: '404 Page Not Found',
      hero: {
        title: 'Cat Not Found',
        desc: '404 Page Not Found'
      }
    })
  })

  app.get('/500', function (req, res, next) {
    next(new Error('Manually visited /500'))
  })

  app.use(function (err, req, res, next) {
    if (config.isProd || req.url === '/500/') {
      // Log the exception
      console.error('EXCEPTION ON ' + req.url)
      console.error('Headers:')
      console.dir(req.headers)
      console.error(err.stack)
      console.error(err.message || err.toString())

      res.render('error', {
        title: 'Internal Server Error',
        hero: {
          title: 'Interal Cat Error',
          desc: '500 Internal Server Error'
        }
      })
    } else {
      // Show stack trace during development
      next(err)
    }
  })
}