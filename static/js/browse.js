// Browse menu dropdown

/**
 * Show or hide the browse menus. If no `menu` parameter is provided, then
 * this shows
 * @param {jQuery=} menu to show/hide
 * @param {boolean=} toggle  force the menu open?
 */
function toggleBrowseMenu (menu, toggle) {
  /*jshint eqnull:true */
  if (toggle == null) toggle = !menu.$browse.hasClass('on')

  function showHide () {
    menu.$btn.toggleClass('on', toggle)
    menu.$browse.toggleClass('on', toggle)

    // Update chevron icon
    var icon = menu.$btn.find('i')
    if (toggle) {
      icon
        .removeClass('icon-chevron-down')
        .addClass('icon-chevron-up')
    } else {
      icon
        .addClass('icon-chevron-down')
        .removeClass('icon-chevron-up')
    }
  }

  // If we are opening a menu and there are already others open, then
  // close them first.
  if (toggle && $('.browse').hasClass('on')) {
    closeBrowseMenus()
    setTimeout(function () {
      showHide()
    }, 200)
  } else {
    showHide()
  }
}

function closeBrowseMenus () {
  _(browseMenus).each(function (menu) {
    toggleBrowseMenu(menu, false)
  })
}

// Get all the browse menus in the page
var browseMenus = []
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
        if (util.isPhone()) return // Only show on larger screens
        toggleBrowseMenu(menu, true)
      } else if (!menu.btnHover || !menu.browseHover) {
        toggleBrowseMenu(menu, false)
      }
    }

    menu.$btn.hover(function (e) {
      menu.btnHover = true
      maybeOpenClose()
    }, function (e) {
      menu.btnHover = false
      maybeOpenClose()
    })
    menu.$browse.hover(function (e) {
      menu.browseHover = true
      maybeOpenClose()
    }, function (e) {
      menu.browseHover = false
      maybeOpenClose()
    })

    browseMenus.push(menu)
  }
})

// Close browse menu on search focus
$('.header .search').on('focusin', function (e) {
  closeBrowseMenus()
})