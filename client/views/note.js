var $ = require('jquery')
var cookies = require('cookies-js')

var CHECK_INTERVAL = 2000

// TODO: remove this
module.exports = function () {
  if (cookies.get('seen_survey')) return

  var interval = window.setInterval(checkForSurvey, CHECK_INTERVAL)
  function checkForSurvey () {
    if ($('#t402-prompt-iframe').length) {
      cookies.set('seen_survey', true, { expires: 60 * 60 * 24 }) // 24 hours
      clearInterval(interval)
    }
  }
}
