var $ = require('jquery')
var config = require('../config')
var url = require('url')
var util = require('../util')

if (window.StripeCheckout) {
  var stripeHandler = window.StripeCheckout.configure({
    key: config.stripe,
    image: config.cdnOrigin + '/images/stripe-image.png',
    locale: 'auto',
    allowRememberMe: false,
    alipay: 'auto',
    email: window.StudyNotes.user,
    opened: function () {
      window.ga('send', 'event', 'pro', 'checkout-open')
    }
  })

  $('.order-btn.pro').on('click', function (e) {
    e.preventDefault()
    openCheckout({
      product: 'pro'
    })
  })

  $('.order-btn.review-proofreading').on('click', function (e) {
    e.preventDefault()
    openCheckout({
      product: 'review-proofreading',
      referrer: '/essay-review-success/'
    })
  })

  $('.order-btn.review-standard').on('click', function (e) {
    e.preventDefault()
    openCheckout({
      product: 'review-standard',
      referrer: '/essay-review-success/'
    })
  })

  $('.order-btn.review-premium').on('click', function (e) {
    e.preventDefault()
    openCheckout({
      product: 'review-premium',
      referrer: '/essay-review-success/'
    })
  })
}

function openCheckout (opts) {
  var query = url.parse(window.location.href, true).query
  var referrer = query.referrer || opts.referrer || window.location.href

  opts.amount = config.product[opts.product].price
  opts.name = config.product[opts.product].desc
  opts.description = 'by Study Notes'

  opts.token = function (token) {
    token.referrer = referrer
    token.product = opts.product

    $.post('/order/', token)
      .done(function (data) {
        if (data.err) {
          window.location = util.addQueryParams(window.location.href, {
            error: data.err
          })
        } else {
          window.location = util.addQueryParams(referrer, {
            ga: opts.product + '.order'
            // TODO
            // success: 'Thanks for purchasing ' + opts.description
          })
        }
      })
  }
  stripeHandler.open(opts)
}
