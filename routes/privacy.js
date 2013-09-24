/*jslint node: true */
"use strict";

module.exports = function (app) {
  app.get('/privacy', function (req, res) {
    res.render('privacy', {
      url: '/privacy',
      title: 'Privacy Policy',
      hero: {
        title: 'Privacy Policy',
        desc: 'i.e. excellent bedtime reading!'
      }
    })
  })
}