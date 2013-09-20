// Browse menu dropdown

/**
 * Show or hide the browse menus. If no `menu` parameter is provided, then
 * this shows
 * @param {boolean=} toggle  force the menu open?
 * @param {jQuery=} menu to show/hide
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
      $browse: $elem
    }

    // Handle clicks on header buttons
    menu.$btn.on('click', function (e) {
      if (e.which != 1) return // Only handle left-clicks
      if (util.isPhone()) return // Only show browse menu on larger screens
      e.preventDefault()
      toggleBrowseMenu(menu)
    })

    browseMenus.push(menu)
  }
})

// Close browse menu on search focus
$('.header .search').on('focusin', function (e) {
  closeBrowseMenus()
})