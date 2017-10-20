var $ = require('jquery')
var cookies = require('cookies-js')

var config = require('../config')

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

function pollfishReady () {
  console.log('pollfish ready')
}

function customSurveyClosed () {
  console.log('user closed the survey')
  setSeenSurvey()
}

function customUserNotEligible () {
  console.log('user is not eligible')
}

function customSurveyFinished () {
  console.log('user finished the survey')
  setSeenSurvey()
}

function customCloseAndNoShow () {
  console.log('close and hide the indicator')
  setSeenSurvey()
}

function customSurveyAvailable (data) {
  console.log('pollfish survey is available with revenue: ' + data.revenue + ' and survey format playful: ' + data.playful)
  console.log(data)

  // Do not show surveys that do not offer revenue
  if (typeof data.revenue !== 'number' || data.revenue === 0) return

  var pageViewCount = Number(cookies.get('page_view_count') || 0)

  if (cookies.get('seen_survey') || pageViewCount < 3) {
    // If user has seen a survey recently or hasn't engaged with the site very much
    // yet, then only show an indicator
    window.Pollfish.showIndicator()
  } else {
    // Otherwise, show the full survey without a prompt
    window.Pollfish.showFullSurvey()
    setSeenSurvey()
  }
}

function setSeenSurvey () {
  cookies.set('seen_survey', true, { expires: 60 * 60 * 6 }) // 6 hours
}

function customSurveyNotAvailable () {
  console.log('pollfish survey not available')
}
