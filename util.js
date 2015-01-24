module.exports = exports = require('./util-node')

/**
 * Add commas to an integer, so that it's easier to read.
 * @param {Integer} x The number
 * @return {String} The number with commas
 */

exports.addCommas = function (x) {
  x += '' // convert to String
  var rgx = /(\d+)(\d{3})/

  while (rgx.test(x)) {
    x = x.replace(rgx, '$1' + ',' + '$2')
  }
  return x
}
