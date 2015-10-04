var $ = require('jquery')
var functionWithTimeout = require('function-with-timeout')
var querystring = require('querystring')

function trackFormSubmit (selector, eventCategory, eventAction) {
  var form = $(selector)
  form.on('submit', function (e) {
    e.preventDefault()
    window.ga('send', 'event', eventCategory, eventAction, {
      hitCallback: functionWithTimeout(function () {
        form.submit()
      })
    })
  })
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
