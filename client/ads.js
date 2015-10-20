var $ = require('jquery')

var $ad = $('.adsense-sidebar .adsbygoogle')
var inserted = false

function checkAd () {
  if (inserted || $ad.length === 0 || $ad.html().trim().length) return

  var house = $('<div class="adsense-sidebar"><a class="house" href="/pro/">College Essays that Worked</a></div>')
  $ad.parent().after(house)

  inserted = true
}

setTimeout(checkAd, 3000)
