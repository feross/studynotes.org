// Disable caching of XHR GET responses globally
// (workaround for jQuery callbacks not firing if the response was cached)
$.ajaxSetup({
    cache: false
})

// Executed when `document` is ready.
// $(function () {
  // Make external links open in new window
  $("a[href^='http:'], a[href^='https:']")
    .not("[href*='www.apstudynotes.org']")
    .attr('target','_blank')

  // Logout via XHR POST
  $('.logout').click(function (e) {
    e.preventDefault()
    $.post('/logout', function () {
      window.location = '/'
    })
  })

  function onResize () {
    updateSearchWidth()
    toolbarOnResize()
    onScroll()
  }
  $window.on('resize', _.throttle(onResize, 100))
  onResize()

  /**
   * Browser scroll event
   */
  function onScroll () {
    closeBrowseMenus()
    hideAutocomplete()
    toolbarOnScroll()
  }
  $window.on('scroll', _.throttle(onScroll, 100))

  /**
   * Filter keystrokes from keymaster when user is searching.
   * https://github.com/madrobby/keymaster
   */
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
// })

$(window).load(updateSearchWidth)
