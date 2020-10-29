const $ = require('jquery')
const functionWithTimeout = require('function-with-timeout')

const url = window.location.href
const encodedUrl = encodeURIComponent(url)

$('.icon-facebook-squared').on('click', function (e) {
  e.preventDefault()
  window.open(
    'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
    'facebook-share', 'width=660,height=620'
  )
  window.ga('send', 'social', 'Facebook', 'Share', url)
})

$('.icon-twitter').on('click', function (e) {
  e.preventDefault()
  const text = encodeURIComponent('Retweet to save a life!')
  window.open(
    'https://twitter.com/intent/tweet?text=' + text + '&url=' + encodedUrl +
    '&original_referer=' + encodedUrl,
    'twitter-share', 'width=550,height=300'
  )
  window.ga('send', 'social', 'Twitter', 'Share', url)
})

$('.icon-tumblr').on('click', function (e) {
  e.preventDefault()
  window.open(
    'https://tumblr.com/widgets/share/tool?canonicalUrl=' + encodedUrl,
    'tumblr-share', 'width=540,height=670'
  )
  window.ga('send', 'social', 'Tumblr', 'Share', url)
})

$('.icon-message').on('click', function (e) {
  e.preventDefault()
  const text = encodeURIComponent('I\'m studying this right now:\n\n' + url)
  const smsUrl = 'sms:&body=' + text
  window.ga('send', 'social', 'SMS', 'Share', url, {
    hitCallback: functionWithTimeout(function () {
      window.location = smsUrl
    })
  })
})
