/*jslint node: true */
/*global app */
"use strict";

var config = require('../config')
var express = require('express')

module.exports = function () {
  app.use(function(req, res) {
    res.status(404).render('error', {
      title: '404 Page Not Found',
      hero: {
        title: '404 Page Not Found',
        desc: 'Sorry about that. Here is a cat for you instead.'
      }
    })
  })

  app.get('/500', function (req, res, next) {
    next(new Error('Manually visited /500'))
  })

  app.use(function (err, req, res, next) {
    // Log the exception
    console.error('EXCEPTION: ' + req.url)
    console.dir(err)
    console.error(err.stack)
    console.error('HEADERS:')
    console.dir(req.headers)

    res.status(500).render('error', {
      title: '500 Internal Server Error',
      hero: {
        title: '500 Internal Server Error',
        desc: 'Sorry about that. Here is a cat for you instead.'
      }
    })
  })
}