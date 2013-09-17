/**
 * Cache DOM element references that are used in DOM events that get triggered
 * frequently (e.g. scroll, resize)
 */
var $browse = $('.browse')
var $coursesButton = $('.header .courses')
var $headerLeft = $('.header .left')
var $headerRight = $('.header .right')
var $search = $('.header .search')
var $searchAndAutocomplete = $('.header .search, .header .autocomplete')
var $html = $('html')
var $window = $(window)
var $searchInput = $('.header .search input')
var $headerAutocomplete = $('.header .autocomplete')
var $content = $('.content')
var $contentToolbar = $('.content .toolbar')


/**
 * Disable caching of jQuery AJAX responses
 * (workaround for callbacks not firing if the response was cached)
 */
$.ajaxSetup({
    cache: false
})


/**
 * Set search bar's width so it fills the header correctly.
 * (Need to ensure this gets called after Typekit fonts are loaded.)
 */
function updateSearchWidth () {
  var headerLeftWidth = $headerLeft.width()
  var headerRightWidth = $headerRight.width()
  $searchAndAutocomplete
  .css({
    'margin-left': headerLeftWidth,
    'margin-right': headerRightWidth
  })

  $search.removeClass('off')
}

/**
 * Continue to set the width every 100ms until fonts are done loading.
 *
 * (If fonts don't load, then wf-loading gets removed automatically
 * after 1000ms, so this won't run forever.)
 */
function updateSearchWidthWhileLoading () {
  updateSearchWidth()
  if ($html.hasClass('wf-loading')) {
    setTimeout(updateSearchWidthWhileLoading, 100)
  }
}
updateSearchWidthWhileLoading()

/**
 * Show or hide the browse menu.
 */
function toggleBrowseMenu (_switch) {
  if (_switch === undefined) {
    _switch = !$browse.hasClass('on')
  }

  $browse.toggleClass('on', _switch)
  $coursesButton.toggleClass('on', _switch)

  var icon = $coursesButton.find('i')
  if (_switch) {
    icon
      .removeClass('icon-chevron-down')
      .addClass('icon-chevron-up')
  } else {
    icon
      .addClass('icon-chevron-down')
      .removeClass('icon-chevron-up')
  }
}


function isPhone () {
  return $window.width() < 800 - 25 // account for scrollbar
}

/**
 * Executed when `document` is ready.
 */
$(function () {

  /**
   * Make external links open in new window
   */
  $("a[href^='http:'], a[href^='https:']")
    .not("[href*='www.apstudynotes.org']")
    .attr('target','_blank')

  /**
   * Browse menu dropdown
   */
  $('.header .courses').on('click', function (e) {
    // Only handle left-clicks
    if (e.which != 1) return

    if (!isPhone()) {
      toggleBrowseMenu()
      e.preventDefault()
    }
  })

  /**
   * Close browse menu on search focus
   */
  $search.on('focusin', function (e) {
    toggleBrowseMenu(false)
  })

  $('.logout').click(function (e) {
    e.preventDefault()
    $.post('/logout', function () {
      window.location = '/'
    })
  })

  /**
   * Browser resize event
   */
  var contentToolbarTop
  var contentBottom
  var contentWidth
  $window.on('resize', _.throttle(function () {
    updateSearchWidth()

    $contentToolbar.removeClass('sticky')
    contentToolbarTop = $contentToolbar.length
      ? $contentToolbar.offset().top
      : null
    contentBottom = $content.length
      ? $content.offset().top + $content.height()
      : null

    contentWidth = $content.width()

    $window.trigger('scroll')
  }, 100))
  $window.trigger('resize')

  /**
   * Browser scroll event
   */
  $window.on('scroll', _.throttle(function () {
    // Close browse menu on page scroll
    toggleBrowseMenu(false)

    // Hide autocomplete dropdown
    $search.removeClass('searching')
    $headerAutocomplete.addClass('off')
    setAutocompletePosition(0)

    if (contentToolbarTop) {
      var scrollTop = $window.scrollTop() // current vertical position from the top

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

  }, 100))


  /**
   * Autocomplete
   */
  var lastAutocompleteTime = +(new Date())
  var lastAutocompleteQuery
  var autocompletePosition = 0 // 0 means nothing is selected, 1 is the first result


  /**
   * Set the selected result in the autocomplete view to the item at `position`.
   *
   * @param {Number} position index (0 = nothing selected, 1 = first result, etc.)
   */

  var setAutocompletePosition = function (position) {
    autocompletePosition = _.isNaN(position)
      ? 1
      : position

    var $results = $('.header .autocomplete .result')
    var len = $results.length

    // Handle numbers that are negative or too big by wrapping around.
    if (autocompletePosition < 0) {
      autocompletePosition = len
    }
    autocompletePosition %= (len + 1)

    $results.removeClass('selected')
    if (autocompletePosition !== 0) {
      var result = $results[autocompletePosition - 1]
      $(result).addClass('selected')
    }
  }


  /**
   * Perform search for autocomplete results and display them
   */

  var doSearchAutocomplete = function () {

    if ($searchInput.val() === lastAutocompleteQuery &&
        !$headerAutocomplete.hasClass('off')) {
      return

    } else if ($searchInput.val() === '') {
      $search.removeClass('searching')
      $headerAutocomplete.addClass('off')
      setAutocompletePosition(0)

    } else {
      $search.addClass('searching')

      var params = { q: $searchInput.val() }
      var time = +(new Date())
      $.get('/autocomplete/', params, function (data) {

        if ($searchInput.val() !== '' && time >= lastAutocompleteTime) {

          lastAutocompleteTime = time
          lastAutocompleteQuery = data.q

          $headerAutocomplete
            .render(data.results, { // template directives
              name: {
                // don't escape search result name, to show formatting
                html: function (params) {
                  return this.name
                }
              },
              result: {
                href: function (params) {
                  return this.url
                },
                'data-position': function (params) { // position
                  return this.position
                },
                'class': function (params) {
                  return params.element.className + ' ' + this.type.toLowerCase()
                }
              }
            })
            .removeClass('off')

          setAutocompletePosition(1)
        }
      })
    }
  }

  $searchInput.on('focus', function (e) {
    if ($searchInput.val() !== '') {
      $search.addClass('searching')
      $headerAutocomplete.removeClass('off')
    }
  })
  $searchInput.on('keyup', doSearchAutocomplete)

  $('.header .autocomplete').on('mouseover', '.result', function (e) {
    var position = parseInt($(this).attr('data-position'), 10)
    setAutocompletePosition(position)
  })


  /**
   * Autocomplete keyboard navigation
   */

  $searchInput.on('keydown', function (e) {
    if (e.which == 38) { // UP
      if ($searchInput.val() === '') {
        $searchInput.trigger('blur') // User meant to scroll page down -- not type into search box
      } else {
        e.preventDefault()
        setAutocompletePosition(autocompletePosition - 1)
      }

    } else if (e.which == 40) { // DOWN
      if ($searchInput.val() === '') {
        $searchInput.trigger('blur')
      } else {
        e.preventDefault()
        setAutocompletePosition(autocompletePosition + 1)
      }

    } else if (e.which == 32) { // SPACE
      if ($searchInput.val() === '') {
        $searchInput.trigger('blur')
      }
    }
  })

  $('.header .search form').on('submit', function (e) { // ENTER
    if (autocompletePosition === 0) {
      if ($searchInput.val().length) {
        return // go to search page
      } else {
        e.preventDefault()
        return // do nothing
      }
    }

    e.preventDefault()

    var $selected = $('.header .autocomplete .result.selected')
    if ($selected.length) {
      window.location = $selected.attr('href')
    }

  })

  $searchInput.on('blur', function (e) {
    window.setTimeout(function () {
      $search.removeClass('searching')
      $headerAutocomplete.addClass('off')
      setAutocompletePosition(0)
    }, 100)
  })

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

  /**
   * Load polyfills for old browsers.
   */
  Modernizr.load([
    {
      test: Modernizr.placeholder,
      nope: '/js/lib/polyfill/jquery.placeholder.min.js',
      callback: function (url, result, key) {
        if (!result) $('input, textarea').placeholder()
      }
    }
  ])

})

$(window).load(function () {
  updateSearchWidth()
})