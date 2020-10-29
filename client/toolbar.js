// Floating content toolbar

const $ = require('jquery')
const $window = $(window)
const $content = $('.content')
const $toolbar = $('.content .toolbar')
const $toolbarGhost = $('.content .toolbar-ghost')

window.toolbarOnScroll = function () {
  if (!$toolbarGhost.length || !$content.length) return

  const toolbarTop = $toolbarGhost.offset().top
  const scrollTop = $window.scrollTop()
  const contentBottom = $content.offset().top + $content.height()

  if (toolbarTop < scrollTop && scrollTop < contentBottom) {
    const contentWidth = $content.width()
    $toolbar
      .addClass('sticky')
      .css({ width: contentWidth + 40 })
  } else {
    $toolbar
      .removeClass('sticky')
      .css({ width: '' })
  }
}
