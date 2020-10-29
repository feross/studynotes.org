const $ = require('jquery')
const functionWithTimeout = require('function-with-timeout')
const url = require('url')

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

const query = url.parse(window.location.href, true).query // eslint-disable-line node/no-deprecated-api

// Track iOS standalone web app page views
if (window.navigator.standalone) {
  window.ga('send', 'event', 'web-app-homescreen', 'ios-pageview')
}

// Track Chrome web app launch
if (typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches) {
  window.ga('send', 'event', 'web-app-homescreen', 'android-launch')
}

// Send tracking events from URL query parameters
let e
if (query.ga) {
  e = query.ga.split('.')
  if (e.length === 2) {
    window.ga('send', 'event', e[0], e[1])
  }
}

if (query.ga) {
  window.history.replaceState(null, null, window.location.pathname)
}

function trackFormSubmit (selector, eventCategory, eventAction) {
  const form = $(selector)

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
