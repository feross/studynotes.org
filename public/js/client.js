// Logging functions for convenience
window.log = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  console.log.apply(console, args);
};
window.error = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  args.unshift('ERROR:');
  console.error.apply(console, args);
};
window.u = _;

// Set search bar's width so it fills the header correctly.
// Need to ensure this gets called after Typekit fonts are loaded.
var $headerLeft = $('.header .left')
  , $headerRight = $('.header .right')
  , $headerSearch = $('.header .search');

function updateHeaderSearchWidth() {
  var headerLeftWidth = $headerLeft.width()
    , headerRightWidth = $headerRight.width();
  $headerSearch
    .css({
      'margin-left': headerLeftWidth,
      'margin-right': headerRightWidth
    })
    .removeClass('off');

  // Continue to set the width every 100ms until fonts are done loading.
  // If fonts don't load, then wf-loading gets removed automatically
  // after 1000ms, so this won't run forever. 
  if ($('html').hasClass('wf-loading')) {
    setTimeout(updateHeaderSearchWidth, 100);
  }
}

// Show or hide the browse menu
function toggleBrowseMenu(_switch) {
  $('.browse').toggleClass('on', _switch);
  $('.header .courses').toggleClass('on', _switch);
}

// On DOM ready
$(function() {

  // Browse menu dropdown
  $('.header .courses').on('click', function (e) {
    // Only handle left-clicks
    if (e.which != 1) return;
    
    toggleBrowseMenu();
    e.preventDefault();
  });

  // Close browse menu on search focus
  $headerSearch.on('focusin', function (e) {
    toggleBrowseMenu(false);
  });

  var $hero = $('.hero, .heroMini')
    , $html = $('html')    
    , $header = $('.header')
    , $window = $(window);

  if ($hero.length) {
    var heroBottom = $hero.offset().top + $hero.height() - $header.height();
  }

  // Close browse menu on page scroll
  $(window).on('scroll', u.throttle(function() {
    toggleBrowseMenu(false);

    // Toggle header text color
    if ($hero.length) {
      var windowScrollTop = $window.scrollTop()
        , className = 'solidHeader'
        , htmlHasClass = $html.hasClass(className);

      if (htmlHasClass && windowScrollTop < heroBottom) {
        $html.removeClass(className);
      } else if (!htmlHasClass && windowScrollTop >= heroBottom) {
        $html.addClass(className);
      }
    
    }
  }, 100));

  updateHeaderSearchWidth();

  // Page-specific JS
  // if ($('body').hasClass('course'))

});

// On DOM load
$(window).load(function() {

});
