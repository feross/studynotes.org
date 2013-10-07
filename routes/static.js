/*jslint node: true */
"use strict";

module.exports = function (app) {
  app.get('/about', function (req, res) {
    res.render('about', {
      url: '/about',
      title: 'About',
      hero: {
        title: 'Say Hello to StudyNotes!',
        desc: 'Fast, free study tools for AP* students'
      }
    })
  })

  app.get('/anon', function (req, res) {
    res.render('anon', {
      url: '/anon',
      title: 'Anonymity',
      hero: {
        title: 'Anonymity',
        desc: 'Some content on StudyNotes is anonymous'
      }
    })
  })

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

  app.get('/open-source', function (req, res) {
    res.render('open-source', {
      url: '/open-source',
      title: 'Open Source',
      hero: {
        title: 'Powered by Open Source',
        desc: 'Free and open, the way all software should be.'
      }
    })
  })

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

  app.get('/plagiarism', function (req, res) {
    res.render('plagiarism', {
      url: '/plagiarism',
      title: 'Our Stance on Plagiarism',
      hero: {
        title: 'Our Stance on Plagiarism',
        desc: 'Don\'t do it!'
      }
    })
  })

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

  app.get('/study-guides', function (req, res) {
    res.render('study-guides', {
      url: '/study-guides',
      title: 'Buy Amazon.com AP Study Guides',
      hero: {
        title: 'Book Store',
        desc: 'Get extra help with study guides from Amazon.com'
      }
    })
  })
}