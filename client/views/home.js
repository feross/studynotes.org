var $ = require('jquery')
var loadScript = require('load-script')

var $window = $(window)

module.exports = function () {
  // Delay Twitter timeline widget until after onload
  $window.load(function () {
    loadScript('https://platform.twitter.com/widgets.js', function () {
      $('.twitter-home').delay(500).animate({ opacity: 1 }, 200)
    })
  })
}
