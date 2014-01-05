var $ = require('jquery')
require('jquery-placeholder')
require('select2')
require('transparency')
require('ckeditor')

var browse = require('./browse')
var Countdown = require('./Countdown')
var editor = require('./editor')
var key = require('keymaster')
var notify = require('./notify')
var search = require('./search')
var socket = require('./socket')
var submitNote = require('./submit-note')
var throttle = require('lodash.throttle')
var toolbar = require('./toolbar')
var url = require('url')
var util = require('../../util')

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
$("a[href^='http:'], a[href^='https:']")
  .not("[href*='www.apstudynotes.org']")
  .attr('target','_blank')

// Logout via XHR POST
$('.logout').click(function (e) {
  e.preventDefault()
  $.post('/logout/', function () {
    window.location = window.location.href
  })
})

function onResize () {
  updateSearchWidth()
  toolbarOnScroll()
}
$window.on('resize', throttle(onResize, 100))

/**
 * Browser scroll event
 */
function onScroll () {
  closeBrowseMenus()
  hideAutocomplete()
  toolbarOnScroll()
}
$window.on('scroll', throttle(onScroll, 100))

/**
 * Filter keystrokes from keymaster when user is searching.
 * https://github.com/madrobby/keymaster
 */
var $searchInput = $('.header .search input')
key.filter = function (event) {
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

// Polyfill <input placeholder=''> in IE9
if (!util.hasPlaceholderSupport()) {
  $('input, textarea').placeholder()
}

/**
 * Continue to update the search width every 50ms until page is done loading.
 */
var loaded = false
function updateSearchWidthWhileLoading () {
  updateSearchWidth()
  if (!loaded) {
    setTimeout(updateSearchWidthWhileLoading, 50)
  }
}
updateSearchWidthWhileLoading()

$(window).load(function () {
  loaded = true
})

// "Welcome back" message
if (localStorage.returning &&
    url.parse(document.referrer).host !== window.location.host) {
  notify.big.info('Welcome back!', { timeout: 2000 })
}
localStorage.returning = true
