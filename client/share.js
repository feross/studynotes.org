var $ = require('jquery')

var url = encodeURIComponent(window.location.href)

$('.icon-facebook-squared').on('click', function (e) {
  e.preventDefault()
  window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, 'sharer', 'width=660,height=620')
})

$('.icon-twitter').on('click', function (e) {
  e.preventDefault()
  var text = encodeURIComponent('Retweet to save a life!')
  window.open('https://twitter.com/intent/tweet?text=' + text + '&url=' + url + '&original_referer=' + url, 'sharer', 'width=550,height=250')
})

$('.icon-tumblr').on('click', function (e) {
  e.preventDefault()
  window.open('https://www.tumblr.com/share/link?url=' + url + '&name=&description=', 'sharer', 'width=540,height=635')
})
