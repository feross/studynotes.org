/*jslint node: true */
/*global app */
"use strict";

module.exports = function () {
  app.get('/photo-credits', function (req, res) {
    res.render('photo-credits', {
      url: '/photo-credits',
      title: 'Photo Credits',
      hero: {
        title: 'Photo Credits',
        desc: 'Many thanks for the beautiful photos!'
      }
    })
  })
}