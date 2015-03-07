// Search and autocomplete

var config = require('../config')

var $ = require('jquery')
var $autocomplete = $('.header .autocomplete')
var $headerLeft = $('.header .left')
var $headerRight = $('.header .right')
var $search = $('.header .search')
var $searchInput = $('.header .search input')

/**
 * Set search bar's width so it fills the header correctly.
 * (Need to ensure this gets called after Typekit fonts are loaded.)
 */
window.updateSearchWidth = function () {
  var headerLeftWidth = $headerLeft.width()
  var headerRightWidth = $headerRight.width()

  var styles = {
    'margin-left': headerLeftWidth,
    'margin-right': headerRightWidth
  }
  $search.css(styles)
  $autocomplete.css(styles)

  $search.removeClass('off')
}

// Autocomplete

var lastAutocompleteTime = +(new Date())
var lastAutocompleteQuery
var autocompletePosition = 0 // 0 = nothing selected, 1 = first result

/**
 * Set the selected result in the autocomplete view to the item at `position`.
 * @param {number} position index
 */
function setAutocompletePosition (position) {
  autocompletePosition = isNaN(position)
    ? 1
    : position

  var $results = $('.header .autocomplete .result')
  var len = $results.length

  // Handle numbers that are negative or too big by wrapping around
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
function doSearchAutocomplete () {
  if ($searchInput.val() === lastAutocompleteQuery
      && !$autocomplete.hasClass('off')) {
    return
  } else if ($searchInput.val() === '') {
    $search.removeClass('searching')
    $autocomplete.addClass('off')
    setAutocompletePosition(0)
  } else {
    $search.addClass('searching')

    var params = { q: $searchInput.val() }
    var time = +(new Date())
    $.get('/autocomplete/', params, function (data) {
      if ($searchInput.val() === '' || time < lastAutocompleteTime) return

      lastAutocompleteTime = time
      lastAutocompleteQuery = data.q

      renderAutocomplete(data)
      setAutocompletePosition(1)
    })
  }
}

/**
 * Render the autocomplete template with data from the server.
 * @param  {Object} data
 */
function renderAutocomplete (data) {
  $autocomplete
    .render(data.results, { // template directives
      name: {
        // don't escape search result name, to show formatting
        html: function () {
          return this.name
        }
      },
      icon: {
        src: function () {
          if (this.type === 'Course' || this.type === 'College') {
            return config.cdnOrigin + '/images/icon/' + this.id + '.png'
          } else {
            return config.cdnOrigin + '/images/icon/transparent.png'
          }
        }
      },
      result: {
        href: function () {
          return this.url
        },
        'data-position': function () {
          return this.position
        },
        'class': function (params) {
          return params.element.className + ' ' + this.type.toLowerCase()
        }
      }
    })
    .removeClass('off')
}

window.hideAutocomplete = function () {
  $search.removeClass('searching')
  $autocomplete.addClass('off')
  setAutocompletePosition(0)
}

$searchInput.on('focus', function () {
  if ($searchInput.val() !== '') {
    $search.addClass('searching')
    $autocomplete.removeClass('off')
  }
})
$searchInput.on('keyup', doSearchAutocomplete)

$('.header .autocomplete').on('mouseover', '.result', function () {
  var position = Number($(this).attr('data-position'))
  setAutocompletePosition(position)
})

// Autocomplete keyboard navigation
$searchInput.on('keydown', function (e) {
  // UP
  if (e.which === 38) {
    if ($searchInput.val() === '') {
      $searchInput.trigger('blur') // User meant to scroll page down -- not type into search box
    } else {
      e.preventDefault()
      setAutocompletePosition(autocompletePosition - 1)
    }

  // DOWN
  } else if (e.which === 40) {
    if ($searchInput.val() === '') {
      $searchInput.trigger('blur')
    } else {
      e.preventDefault()
      setAutocompletePosition(autocompletePosition + 1)
    }

  // SPACE
  } else if (e.which === 32) {
    if ($searchInput.val() === '') {
      $searchInput.trigger('blur')
    }
  }
})

// ENTER
$('.header .search form').on('submit', function (e) {
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

$searchInput.on('blur', function () {
  window.setTimeout(function () {
    $search.removeClass('searching')
    $autocomplete.addClass('off')
    setAutocompletePosition(0)
  }, 100)
})
