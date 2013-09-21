// Floating content toolbar

var $window = $(window)
var $content = $('.content')
var $toolbar = $('.content .toolbar')
var $toolbarGhost = $('.content .ghost')

function toolbarOnScroll () {
  var toolbarTop = $toolbarGhost.length
    ? $toolbarGhost.offset().top
    : null
  var contentWidth = $content.width()

  if (toolbarTop) {
    var scrollTop = $window.scrollTop() // current vertical position from the top

    var contentBottom = $content.length
      ? $content.offset().top + $content.height()
      : null

    if (toolbarTop < scrollTop && scrollTop < contentBottom) {
      $toolbar
        .addClass('sticky')
        .css({ width: contentWidth })
    } else {
      $toolbar
        .removeClass('sticky')
        .css({ width: '' })
    }
  }
}