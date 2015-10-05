var $ = require('jquery')
var functionWithTimeout = require('function-with-timeout')
var querystring = require('querystring')

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

// Submit category
trackFormSubmit('form.submit-essay', 'submit', 'essay')
trackFormSubmit('form.submit-note', 'submit', 'note')

// User category
trackFormSubmit('form.signup', 'user', 'signup')
trackFormSubmit('form.signup2', 'user', 'signup2')
trackFormSubmit('form.login', 'user', 'login')
trackFormSubmit('form.login-forgot', 'user', 'login-forgot')
trackFormSubmit('form.login-forgot', 'user', 'login-reset')

if ($('.subscribe-on-blur').length) {
  window.ga('send', 'event', 'pro', 'paywall')
}

var query = querystring.parse(
  window.location.search.replace(/^\?/, '')
)
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
