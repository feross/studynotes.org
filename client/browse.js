// Browse menu dropdown

var $ = require('jquery')

/**
 * Show or hide the browse menus. If no `menu` parameter is provided, then
 * this shows
 * @param {jQuery=} menu to show/hide
 * @param {boolean=} toggle  force the menu open?
 */
function toggleBrowseMenu (menu, toggle) {
  /*jshint eqnull:true */
  if (toggle == null) toggle = !menu.$browse.hasClass('on')

  menu.$btn.toggleClass('on', toggle)
  menu.$browse.toggleClass('on', toggle)

  // Update chevron icon
  var icon = menu.$btn.find('i')
  if (toggle) {
    icon
      .removeClass('fa-chevron-down')
      .addClass('fa-chevron-up')
  } else {
    icon
      .addClass('fa-chevron-down')
      .removeClass('fa-chevron-up')
  }
}

var browseMenus = []
window.closeBrowseMenus = function () {
  browseMenus.forEach(function (menu) {
    toggleBrowseMenu(menu, false)
  })
}

// Get all the browse menus in the page
$('.browse').each(function (i, elem) {
  var $elem = $(elem)
  var name = /browse-(\w+)/.exec($elem.attr('class'))
  if (name) {
    name = name[1]
    var menu = {
      name: name,
      $btn: $('.header .' + name),
      $browse: $elem,
      btnHover: false,
      browseHover: false
    }

    var maybeOpenClose = function () {
      if (menu.btnHover || menu.browseHover) {
        // Only show on larger screens
        if ($('html').hasClass('isMobile')) return
        toggleBrowseMenu(menu, true)
      } else if (!menu.btnHover || !menu.browseHover) {
        toggleBrowseMenu(menu, false)
      }
    }

    menu.$btn.hover(function () {
      menu.btnHover = true
      maybeOpenClose()
    }, function () {
      menu.btnHover = false
      maybeOpenClose()
    })
    menu.$browse.hover(function () {
      menu.browseHover = true
      maybeOpenClose()
    }, function () {
      menu.browseHover = false
      maybeOpenClose()
    })

    browseMenus.push(menu)
  }
})

// Close browse menu on search focus
$('.header .search').on('focusin', function () {
  window.closeBrowseMenus()
})
