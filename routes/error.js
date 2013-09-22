/*jslint node: true */
/*global app */
"use strict";

var config = require('../config')
var express = require('express')
var httpStatus = require('http-status-codes')

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
    console.error(err.stack)
    console.error('HEADERS:')
    console.dir(req.headers)

    var code = 500
    if (typeof err.status === 'number') {
      code = err.status
    }

    res.status(code).render('error', {
      title: code + ' ' + httpStatus.getStatusText(code),
      hero: {
        title: code + ' ' + httpStatus.getStatusText(code),
        desc: 'Sorry about that. Here is a cat for you instead.'
      }
    })
  })
}