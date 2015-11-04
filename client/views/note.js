var $ = require('jquery')

var CHECK_INTERVAL = 2000

module.exports = function () {
  var seenSurvey = document.cookie.indexOf('seen_survey=1') >= 0
  if (seenSurvey) return

  var interval = window.setInterval(checkForSurvey, CHECK_INTERVAL)
  function checkForSurvey () {
    if ($('#t402-prompt-iframe').length) {
      document.cookie = 'seen_survey=1'
      clearInterval(interval)
    }
  }
}
