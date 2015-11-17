var $ = require('jquery')
var functionWithTimeout = require('function-with-timeout')
var url = require('url')

// Initial Facebook tracking
window.fbq('init', '1696013757293784')
window.fbq('track', 'PageView')

// Track note and essay submissions
trackFormSubmit('form.submit-essay', 'submit', 'essay')
trackFormSubmit('form.submit-note', 'submit', 'note')

// Track signups, logins, and password resets
trackFormSubmit('form.signup', 'user', 'signup')
trackFormSubmit('form.signup2', 'user', 'signup2')
trackFormSubmit('form.login', 'user', 'login')
trackFormSubmit('form.login-forgot', 'user', 'login-forgot')
trackFormSubmit('form.login-forgot', 'user', 'login-reset')

// Track paywall displays
if ($('.subscribe-on-blur').length) {
  window.ga('send', 'event', 'pro', 'paywall')
}

var query = url.parse(window.location.href, true).query

// Track iOS standalone web app page views
if (window.navigator.standalone) {
  window.ga('send', 'event', 'web-app-homescreen', 'ios-pageview')
}

// Track Chrome web app launch
if (query.homescreen) {
  window.ga('send', 'event', 'web-app-homescreen', 'android-launch')
}

// Send tracking events from URL query parameters
var e
if (query.ga) {
  e = query.ga.split('.')
  if (e.length === 2) {
    window.ga('send', 'event', e[0], e[1])
  }
}

if (query.fbq) {
  e = query.fbq.split('.')
  if (e.length === 1) {
    window.fbq('track', e[0])
  } else if (e.length === 2) {
    window.fbq('track', e[0], { value: Number(e[1]) / 100, currency: 'USD' })
  }
}

if (query.ga || query.fbq) {
  window.history.replaceState(null, null, window.location.pathname)
}

function trackFormSubmit (selector, eventCategory, eventAction) {
  var form = $(selector)

  function onSubmit (e) {
    e.preventDefault()
    form.off('submit', onSubmit)
    window.ga('send', 'event', eventCategory, eventAction, {
      hitCallback: functionWithTimeout(function () {
        form.submit()
      })
    })
  }

  form.on('submit', onSubmit)
}
