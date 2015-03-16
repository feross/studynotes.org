var $ = require('jquery')
require('transparency')
require('select2')

require('./browse')
require('./Countdown')
require('./editor')
require('./search')
require('./socket')
require('./submit-note')
require('./toolbar')

var config = require('../config')
var key = require('keymaster')
var notify = require('./notify')
var throttle = require('lodash.throttle')
var url = require('url')

var $window = $(window)

$.ajaxSetup({
  // Disable caching of XHR GET responses globally
  // (workaround for jQuery callbacks not firing if the response was cached)
  cache: false,

  // Send CSRF token with XHR requests
  beforeSend: function (xhr, settings) {
    if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
      // Only send the token to relative URLs i.e. locally.
      xhr.setRequestHeader('X-CSRF-Token', $('input[name="_csrf"]').val())
    }
  }
})

// Make external links open in new window
$('a[href^="http:"], a[href^="https:"]')
  .not('[href*="' + config.siteOrigin + '"]')
  .attr('target', '_blank')

// Logout via XHR POST
$('.logout').click(function (e) {
  e.preventDefault()
  $.post('/logout/')
    .done(function () {
      window.location = config.siteOrigin + window.location.pathname +
        '?info=You%20are%20logged%20out!'
    })
    .fail(function () {
      notify.big.error('Error contacting the server!')
    })
})

function onResize () {
  window.updateSearchWidth()
  window.toolbarOnScroll()
}
$window.on('resize', throttle(onResize, 100))

/**
 * Browser scroll event
 */
function onScroll () {
  window.closeBrowseMenus()
  window.hideAutocomplete()
  window.toolbarOnScroll()
}
$window.on('scroll', throttle(onScroll, 100))

/**
 * Filter keystrokes from keymaster when user is searching.
 * https://github.com/madrobby/keymaster
 */
var $searchInput = $('.header .search input')
key.filter = function () {
  return $searchInput.val() === ''
}

key('left', function () {
  var $prev = $('.noteNav .prev')
  if ($prev.length) {
    window.location = $prev.attr('href')
  }
})
key('right', function () {
  var $next = $('.noteNav .next')
  if ($next.length) {
    window.location = $next.attr('href')
  }
})

/**
 * Continue to update the search width every 50ms until page is done loading.
 */
var loaded = false
function updateSearchWidthWhileLoading () {
  window.updateSearchWidth()
  if (!loaded) {
    setTimeout(updateSearchWidthWhileLoading, 50)
  }
}
updateSearchWidthWhileLoading()

$(window).load(function () {
  loaded = true

  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then(function (registration) {
        console.log('service worker registered')
        console.log(registration)
      })
      .catch(function (err) {
        console.error('service worker failed')
        console.error(err)
      })
  }
})

// "Welcome back" message
if (document.cookie.match('returning=true') && // this is a returning visitor
    url.parse(document.referrer).host !== window.location.host) { // external site
  notify.big.info('Welcome back!', { timeout: 2000 })
}
document.cookie = 'returning=true'

var match = /(success|error|info)=([^?&]+)/g.exec(window.location.search)
var msgType = match && match[1]
var msg = match && match[2]
if (msgType && msg) {
  notify.big[msgType](window.decodeURIComponent(msg))
  window.history.replaceState(null, null, window.location.pathname)
}

$(function () {
  $('.notify').each(function () {
    var $item = $(this)
    if ($item.hasClass('notify-success')) {
      notify.big.success($item.text())
    } else if ($item.hasClass('notify-error')) {
      notify.big.error($item.text())
    } else {
      notify.big.info($item.text())
    }
  })
})
