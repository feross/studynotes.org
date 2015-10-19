var $ = require('jquery')
var config = require('../config')
var notify = require('./notify')
var url = require('url')
var util = require('../util')

if (window.StripeCheckout) {
  var query = url.parse(window.location.href, true).query
  var referringEssay = query.referringEssay || window.location.href

  var stripeHandler = window.StripeCheckout.configure({
    key: config.stripe,
    amount: config.proPrice,
    name: 'Study Notes',
    description: '100+ Top College Essays',
    image: config.cdnOrigin + '/images/stripe-image.png',
    locale: 'auto',
    allowRememberMe: false,
    alipay: 'auto',
    email: window.StudyNotes.user,
    token: function (token) {
      token.referringEssay = referringEssay
      $.post('/pro/', token)
        .done(function () {
          window.location = util.addQueryParams(referringEssay, {
            ga: 'pro.order',
            fbq: 'Purchase.' + config.proPrice
            // TODO
            // success: 'Thanks for purchasing Study Notes Pro!'
          })
        })
        .fail(function () {
          notify.big.error('Error contacting the server!')
        })
    }
  })

  $('.pro-btn').on('click', function (e) {
    e.preventDefault()
    stripeHandler.open()
  })

  // Close Checkout on page navigation
  $(window).on('popstate', function () {
    stripeHandler.close()
  })
}
