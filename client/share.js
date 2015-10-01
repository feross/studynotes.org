var $ = require('jquery')

var url = window.location.href
var encodedUrl = encodeURIComponent(url)

$('.icon-facebook-squared').on('click', function (e) {
  e.preventDefault()
  window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl, 'facebook-share', 'width=660,height=620')
  window.ga('send', 'social', 'Facebook', 'Share', url)
})

$('.icon-twitter').on('click', function (e) {
  e.preventDefault()
  var text = encodeURIComponent('Retweet to save a life!')
  window.open('https://twitter.com/intent/tweet?text=' + text + '&url=' + encodedUrl + '&original_referer=' + encodedUrl, 'twitter-share', 'width=550,height=260')
  window.ga('send', 'social', 'Twitter', 'Share', url)
})

$('.icon-tumblr').on('click', function (e) {
  e.preventDefault()
  window.open('https://tumblr.com/widgets/share/tool?canonicalUrl=' + encodedUrl, 'tumblr-share', 'width=540,height=740')
  window.ga('send', 'social', 'Tumblr', 'Share', url)
})
