var auto = require('run-auto')
var config = require('../config')
var debug = require('debug')('studynotes:routes/pro')
var model = require('../model')
var secret = require('../secret')
var values = require('object-values')

var stripe = require('stripe')(secret.stripe)

module.exports = function (app) {
  app.get('/pro/:collegeId?', function (req, res, next) {
    // Send pro users to the essays page
    if (req.isAuthenticated() && req.user.pro) {
      return res.redirect('/essays/')
    }

    var college = model.cache.colleges[req.params.collegeId]
    if (!college && req.params.collegeId) return next()

    auto({
      essays: function (cb) {
        model.Essay
          .find()
          .select('-prompt -body -bodyPaywall -bodyTruncate')
          .populate('college')
          .sort('-hits')
          .exec(cb)
      }
    }, function (err, r) {
      if (err) return next(err)
      var heroTitle = college
        ? college.shortName + ' Essays that Worked'
        : 'College Essays that Worked'

      var heroImage = college
        ? college.id + '.jpg'
        : 'amjed.jpg'

      var collegeEssays = college
        ? r.essays.filter(e => e.college.id === college.id)
        : r.essays
      var otherEssays = college
        ? r.essays.filter(e => e.college.id !== college.id)
        : r.essays

      var otherColleges = college
        ? model.cache.collegesByRank.filter(c => c.id !== college.id)
        : model.cache.collegesByRank

      var collegeList, collegeListAnd
      if (!college || college.id === 'stanford') {
        collegeList = 'Stanford, Harvard, Princeton'
        collegeListAnd = 'Stanford, Harvard, and Princeton'
      } else if (college.id === 'harvard') {
        collegeList = 'Harvard, Stanford, Princeton'
        collegeListAnd = 'Harvard, Stanford, and Princeton'
      } else {
        collegeList = college.shortName + ', Stanford, Harvard'
        collegeListAnd = college.shortName + ', Stanford, and Harvard'
      }

      var title = college
        ? college.shortName + ' Essays that Worked'
        : 'College Essays that Worked'

      res.render('pro', {
        title: title,
        url: '/pro/' + (college ? college.id : ''),
        hero: {
          title: heroTitle,
          image: heroImage
        },
        college: college,
        collegeEssays: collegeEssays,
        collegeList: collegeList,
        collegeListAnd: collegeListAnd,
        essays: r.essays,
        otherColleges: otherColleges,
        otherEssays: otherEssays
      })
    })
  })

  app.post('/pro', function (req, res, next) {
    var amount = config.proPrice

    auto({
      stripeCharge: function (cb) {
        stripe.charges.create({
          amount: amount, // in cents
          currency: 'usd',
          card: req.body.id,
          description: 'Study Notes Pro (' + req.body.email + ')'
        }, cb)
      },

      order: ['stripeCharge', function (cb, r) {
        var order = new model.Order({
          stripeEmail: req.body.email,
          stripeToken: req.body.id,
          amount: amount,
          referringEssay: req.body.referringEssay,
          freeEssays: req.session.free,
          stripeCharge: JSON.stringify(r.stripeCharge)
        })

        order.save(function (err, order) {
          cb(err, order)
        })
      }]

    }, function (err, r) {
      if (err) {
        if (err.type === 'StripeCardError') {
          req.flash('error', 'Your card has been declined. Please try again!')
          debug('Card declined: %s', err.message)
          return res.redirect(req.body.referringEssay || 'back')
        } else if (err.errors) {
          // errors from mongoose validation
          values(err.errors).forEach(function (error) {
            req.flash('error', error.message)
          })
          return res.redirect(req.body.referringEssay || 'back')
        } else {
          return next(err)
        }
      }

      // User is officially Pro now
      req.session.pro = {
        email: r.order.stripeEmail,
        orderId: r.order.id
      }

      // Redirect to original essay after signup/login
      req.session.returnTo = req.body.referringEssay
      res.sendStatus(200)
    })
  })
}
