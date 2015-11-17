var $ = require('jquery')

if (window.adsbygoogle) {
  window.addEventListener('load', function () {
    if (!window.adsbygoogle.loaded) {
      showHouseAd()
      window.ga('send', 'event', 'AdSense', 'AdBlock', { nonInteraction: 1 })
    }
  }, false)
}

function showHouseAd () {
  var $ad = $('.adsense-sidebar .adsbygoogle')
  if ($ad.length === 0) return

  var $firstAd = $ad.parent().eq(0)
  var $houseAd = $('<div class="adsense-sidebar"><a class="house" href="/pro/">College Essays that Worked</a></div>')
  $firstAd.after($houseAd)
}
