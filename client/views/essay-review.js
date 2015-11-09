var $ = window.$ = require('jquery')

module.exports = function () {
  var pricingTop = $('.pricing-heading').offset().top
  $('.see-pricing').on('click', function () {
    window.scrollTo(0, pricingTop)
  })
}
