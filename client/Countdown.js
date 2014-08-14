var $ = require('jquery')
var moment = require('moment')

/**
 * Countdown to a specific date
 * @param {String} selector jQuery selector to bind the countdown timer to
 * @param {Date} date     Date to countdown to
 */
function Countdown (selector, date) {
  this.$elem = $(selector)

  if (this.$elem.length === 0)
    return

  this.date = moment(date)
  this.interval = window.setInterval(this.update.bind(this), 1000)

  this.update()
}

Countdown.prototype.update = function () {
  var now = moment()
  var diff = moment.duration(this.date.diff(now))
  var obj = {
      days: Math.floor(diff.asDays()),
      hours: diff.hours(),
      minutes: diff.minutes(),
      seconds: diff.seconds(),
      date: this.date.format('MMMM Do, YYYY')
    }

    this.$elem.render(obj)
}

Countdown.prototype.stop = function () {
  window.clearInterval(this.interval)
}

// Setup countdown timer, if applicable
if (window.countdownDate) {
  new Countdown('.countdown', countdownDate)
}
