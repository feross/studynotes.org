var $ = require('jquery')

var config = require('../../config')
var util = require('../../util')

module.exports = function () {
  // Export jQuery because Pollfish relies on it (not newer than jquery 2.x)
  window.jQuery = $

  window.pollfishConfig = {
    api_key: '4bcb80a1-8769-442e-9b05-86e336418b39',
    debug: !config.isProd,
    indicator_position: 'BOTTOM_RIGHT',

    ready: pollfishReady,
    closeCallback: customSurveyClosed,
    userNotEligibleCallback: customUserNotEligible,
    closeAndNoShowCallback: customCloseAndNoShow,
    surveyCompletedCallback: customSurveyFinished,
    surveyAvailable: customSurveyAvailable,
    surveyNotAvailable: customSurveyNotAvailable
  }

  util.insertScript('https://storage.googleapis.com/pollfish_production/sdk/webplugin/pollfish.min.js')

  function pollfishReady () {
    console.log('pollfish ready')
  }

  function customSurveyClosed () {
    console.log('user closed the survey')
  }

  function customUserNotEligible () {
    console.log('user is not eligible')
  }

  function customSurveyFinished () {
    console.log('user finished the survey')
  }

  function customCloseAndNoShow () {
    console.log('close and hide the indicator')
  }

  function customSurveyAvailable (data) {
    console.log('pollfish survey is available with revenue: ' + data.revenue + ' and survey format playful: ' + data.playful)
    console.log(data)
    if (data.revenue > 0) window.Pollfish.showFullSurvey()
  }

  function customSurveyNotAvailable () {
    console.log('pollfish survey not available')
  }
}
