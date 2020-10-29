const $ = require('jquery')
const loadScript = require('load-script')

module.exports = function () {
  // Delay Twitter timeline widget until after onload
  $(window).on('load', function () {
    if (!window.StudyNotes.isMobile) {
      loadScript('https://platform.twitter.com/widgets.js', function () {
        $('.twitter-home').delay(500).animate({ opacity: 1 }, 200)
      })
    }
  })
}
