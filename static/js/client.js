;(function() {

// Avoid `console` errors in browsers that lack a console.
var method
  , noop = function noop() {}
  , methods = [
  'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
  'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
  'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
  'timeStamp', 'trace', 'warn']
  , length = methods.length
  , console = (window.console = window.console || {})

while (length--) {
  method = methods[length]

  // Only stub undefined methods.
  if (!console[method]) {
    console[method] = noop
  }
}

// Short-named logging functions for convenience
window.log = function() {
  var args = Array.prototype.slice.call(arguments, 0)
  if (console.log.apply) console.log.apply(console, args)
}
window.error = function() {
  var args = Array.prototype.slice.call(arguments, 0)
  args.unshift('ERROR:')
  if (console.error.apply) console.error.apply(console, args)
}

}())



;(function() {

window.u = _

var $headerLeft = $('.header .left')
  , $headerRight = $('.header .right')
  , $search = $('.header .search')
  , $searchAndAutocomplete = $('.header .search, .header .autocomplete')
  , $html = $('html')
  , $window = $(window)
  , $hero = $('.hero')
  , $heroText = $('.hero .text')
  , $heroTabs = $('.hero .tabs')
  , heroTextTop = 75
  , modernizrTransition = Modernizr.csstransitions

// Disable caching of AJAX responses
$.ajaxSetup ({
    cache: false
})

// Set search bar's width so it fills the header correctly.
// Need to ensure this gets called after Typekit fonts are loaded.
function updatesearchWidth() {
  var headerLeftWidth = $headerLeft.width()
    , headerRightWidth = $headerRight.width()
  $searchAndAutocomplete
  .css({
    'margin-left': headerLeftWidth,
    'margin-right': headerRightWidth
  })

  $search.removeClass('off')

  // Continue to set the width every 100ms until fonts are done loading.
  // If fonts don't load, then wf-loading gets removed automatically
  // after 1000ms, so this won't run forever. 
  if ($('html').hasClass('wf-loading')) {
    setTimeout(updatesearchWidth, 100)
  }
}

// Show or hide the browse menu
function toggleBrowseMenu(_switch) {
  $('.browse').toggleClass('on', _switch)
  $('.header .courses').toggleClass('on', _switch)
}

// On DOM ready
$(function() {

  updatesearchWidth()

  // Browse menu dropdown
  $('.header .courses').on('click', function (e){
    // Only handle left-clicks
    if (e.which != 1) return
    
    toggleBrowseMenu()
    e.preventDefault()
  })

  // Close browse menu on search focus
  $search.on('focusin', function (e){
    toggleBrowseMenu(false)
  })

  var headerHeight = $('.header').height()
  var heroBottom = $hero.length
    ? $hero.offset().top + $hero.height() - headerHeight
    : undefined

  // Scroll events  
  $window.on('scroll', u.throttle(function(){
    // Close browse menu on page scroll
    toggleBrowseMenu(false)

    // Hide autocomplete dropdown
    $search.removeClass('searching')
    $headerAutocomplete.addClass('off')

    if ($hero.length) {
      var windowScrollTop = $window.scrollTop()
        , isSolid = $html.hasClass('solidHeader')
        , isHeroDim = $hero.hasClass('dim')

      // Toggle header change: solid <-> transparent
      if (isSolid && windowScrollTop < heroBottom) {
        $html.removeClass('solidHeader')
      } else if (!isSolid && windowScrollTop >= heroBottom) {
        $html.addClass('solidHeader')
      }
    
      // Fade out hero text when underneath header
      if (isHeroDim && windowScrollTop < heroTextTop) {
        $hero.removeClass('dim')
        if (!modernizrTransition) {
          $heroText.animate({ opacity: 1 }, 500)
          $heroTabs.animate({ opacity: 1 }, 500)
        }
      } else if (!isHeroDim && windowScrollTop >= heroTextTop) {
        $hero.addClass('dim')
        if (!modernizrTransition) {
          $heroText.animate({ opacity: 0 }, 500)
          $heroTabs.animate({ opacity: 0 }, 500)
        }
      }
    }
  }, 100))


  // Autocomplete

  var $searchInput = $('.header .search input')
    , $headerAutocomplete = $('.header .autocomplete')
    , lastAutocompleteTime = +(new Date)
    , lastAutocompleteQuery
    , autocompletePosition = 1 // 0 means nothing is selected, 1 is the first result


  /**
   * Set the selected result in the autocomplete view to the item at `position`.
   *
   * @param {Number} position index (0 = nothing selected, 1 = first result, etc.)
   */
  var setAutocompletePosition = function (position) {
    autocompletePosition = position

    var $results = $('.header .autocomplete .result')
      , len = $results.length

    // Handle numbers that are negative or too big by wrapping around.
    if (autocompletePosition < 0) {
      autocompletePosition = len
    }
    autocompletePosition %= (len + 1)

    $results.removeClass('selected')
    if (autocompletePosition != 0) {
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

    } else if ($searchInput.val() == '') {
      $search.removeClass('searching')
      $headerAutocomplete.addClass('off')
    
    } else {
      $search.addClass('searching')
      
      var params = { q: $searchInput.val() }
      var time = +(new Date)
      $.get('/autocomplete_endpoint/', params, function(data) {
        
        if ($searchInput.val() == '') {
          $headerAutocomplete.addClass('off')

        } else if (time >= lastAutocompleteTime) {
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
                }
              }
            })
            .removeClass('off')

          setAutocompletePosition(autocompletePosition)
        }
      })
    }
  }

  $searchInput.on('focus', function (e) {
    if ($searchInput.val() != '') {
      $search.addClass('searching')
      $headerAutocomplete.removeClass('off')
    }
  })
  $searchInput.on('keyup', doSearchAutocomplete)

  $('.header .autocomplete').on('mouseover', '.result', function (e) {
    var position = parseInt($(this).attr('data-position'))
    setAutocompletePosition(position)
  })

  // Autocomplete keyboard shortcuts

  $searchInput.on('keydown', function (e) {
    if (e.which == 38) { // up key
      e.preventDefault()
      e.stopPropagation()

      setAutocompletePosition(autocompletePosition - 1)

    } else if (e.which == 40) { // down key
      e.preventDefault()
      e.stopPropagation()

      setAutocompletePosition(autocompletePosition + 1)
    }
  })
  $('.header .search form').on('submit', function (e) { // enter key
    if (autocompletePosition != 0) {
      e.preventDefault()

      var $selected = $('.header .autocomplete .result.selected')
      window.location = $selected.attr('href')
    }
  })
  
  $searchInput.on('blur', function (e) {
    window.setTimeout(function () {
      $search.removeClass('searching')
      $headerAutocomplete.addClass('off')
    }, 100)
  })


  // Load polyfills for old browsers
  Modernizr.load(
    [ { test: Modernizr.placeholder
      , nope: '/js/lib/polyfill/jquery.placeholder.min.js'
      , callback: function(url, result, key) {
          if (!result) $('input, textarea').placeholder()
        }
      }
    ]
  )

})

// On DOM load
$(window).load(function() {

})

}())
