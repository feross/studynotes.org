// Client utility functions

var util = {}

util.isPhone = function () {
  return $(window).width() < 800 - 25 // account for scrollbar
}

util.hasPlaceholderSupport = function () {
  var i = document.createElement('input')
  return 'placeholder' in i
}

;(function() {

  // Avoid `console` errors in browsers that lack a console.
  var method
  var noop = function noop() {}
  var methods = [
    'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
    'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
    'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
    'timeStamp', 'trace', 'warn'
  ]
  var length = methods.length
  var console = (window.console = window.console || {})

  while (length--) {
    method = methods[length]

    // Only stub undefined methods.
    if (!console[method]) {
      console[method] = noop
    }
  }

}())