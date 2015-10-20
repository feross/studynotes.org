var $ = require('jquery')

var $ad = $('.adsense-sidebar .adsbygoogle')
var replaced = false

function checkAd () {
  if (replaced || $ad.length === 0 || $ad.html().trim().length) return

  var html = '<a class="house" href="/pro/">College Essays that Worked</a>'
  $($ad.get(0)).replaceWith(html)

  replaced = true
}

setTimeout(checkAd, 5000)
