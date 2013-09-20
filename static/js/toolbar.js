// Floating content toolbar

var $window = $(window)
var $content = $('.content')
var $contentToolbar = $('.content .toolbar')

var contentToolbarTop
var contentWidth

function toolbarOnResize () {
  $contentToolbar.removeClass('sticky') // TODO: can this be removed?

  contentToolbarTop = $contentToolbar.length
    ? $contentToolbar.offset().top
    : null
  contentWidth = $content.width()
}

function toolbarOnScroll () {
  if (contentToolbarTop) {
    var scrollTop = $window.scrollTop() // current vertical position from the top

    var contentBottom = $content.length
      ? $content.offset().top + $content.height()
      : null

    if (contentToolbarTop < scrollTop && scrollTop < contentBottom) {
      $contentToolbar
        .addClass('sticky')
        .css({ width: contentWidth })
    } else {
      $contentToolbar
        .removeClass('sticky')
        .css({ width: '' })
    }
  }
}