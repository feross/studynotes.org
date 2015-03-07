var $ = require('jquery')
var moment = require('moment')

/**
 * Countdown to a specific date
 * @param {String} selector jQuery selector to bind the countdown timer to
 * @param {Date} date     Date to countdown to
 */
function countdown (selector, date) {
  var $elem = $(selector)

  if ($elem.length === 0) return

  date = moment(date)

  window.setInterval(update, 1000)
  update()

  function update () {
    var now = moment()
    var diff = moment.duration(date.diff(now))
    var obj = {
      days: Math.floor(diff.asDays()),
      hours: diff.hours(),
      minutes: diff.minutes(),
      seconds: diff.seconds(),
      date: date.format('MMMM Do, YYYY')
    }
    $elem.render(obj)
  }
}

// Setup countdown timer, if applicable
if (window.countdownDate) {
  countdown('.countdown', window.countdownDate)
}
