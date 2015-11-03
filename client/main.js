var $ = require('jquery')

require('transparency')
require('select2')

require('./ads')
require('./browse')
require('./Countdown')
require('./editor')
require('./metrics')
require('./pro')
require('./search')
require('./share')
require('./socket')
require('./submit')
require('./toolbar')

var config = require('../config')
var fastclick = require('fastclick')
var key = require('keymaster')
var notify = require('./notify')
var throttle = require('throttleit')
var url = require('url')
var util = require('../util')

var EVENT_THROTTLE = 100

// Remove 300ms tap delay on iOS
fastclick(document.body)

var $window = $(window)

window.isMobile = $('html').hasClass('mobile')

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
  .not('a[href^="' + config.siteOrigin + '"]')
  .attr('target', '_blank')

// Logout via XHR POST
$('.logout').on('click', function (e) {
  e.preventDefault()
  $.post('/logout/')
    .done(function () {
      var url = util.addQueryParams(window.location.href, {
        info: 'You are logged out!'
      })
      window.location = url
    })
    .fail(function () {
      notify.big.error('Error contacting the server!')
    })
})

function onResize () {
  window.updateSearchWidth()
  window.toolbarOnScroll()
}
$window.on('resize', throttle(onResize, EVENT_THROTTLE))

/**
 * Browser scroll event
 */
function onScroll () {
  window.toolbarOnScroll()
  window.closeBrowseMenus()
  window.hideAutocomplete()
}
$window.on('scroll', throttle(onScroll, EVENT_THROTTLE))

/**
 * Filter keystrokes from keymaster when user is searching.
 * https://github.com/madrobby/keymaster
 */
var $search = $('.header .search')
key.filter = function () {
  return !$search.hasClass('searching')
}

key('left', function () {
  var $prev = $('.after-content .prev')
  if ($prev.length) {
    window.location = $prev.attr('href')
  }
})
key('right', function () {
  var $next = $('.after-content .next')
  if ($next.length) {
    window.location = $next.attr('href')
  }
})

$window.load(function () {
  onResize()
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/service-worker.js', { scope: './' })
      .then(function (registration) {
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

// View-specific code
var pathname = window.location.pathname
if (pathname === '/') require('./views/home')()
if (pathname === '/admin/') require('./views/admin')()
