// Floating content toolbar

var $ = require('jquery')
var $window = $(window)
var $content = $('.content')
var $toolbar = $('.content .toolbar')
var $toolbarGhost = $('.content .toolbar-ghost')

window.toolbarOnScroll = function () {
  if (!$toolbarGhost.length || !$content.length) return

  var toolbarTop = $toolbarGhost.offset().top
  var scrollTop = $window.scrollTop()
  var contentBottom = $content.offset().top + $content.height()

  if (toolbarTop < scrollTop && scrollTop < contentBottom) {
    var contentWidth = $content.width()
    $toolbar
      .addClass('sticky')
      .css({ width: contentWidth + 40 })
  } else {
    $toolbar
      .removeClass('sticky')
      .css({ width: '' })
  }
}
