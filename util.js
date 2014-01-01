/*jslint node: true */
// Utility functions. For node and the browser.

var util = {}

/**
 * Copy all of the properties in the source objects over to the destination
 * object, and return the destination object. It's in-order, so the last
 * source will override properties of the same name in previous arguments.
 * @type {function(Object, ...[Object]): Object}
 */
util.extend = function (dest /*, ... */) {
  var sources = Array.prototype.slice.call(arguments, 1)
  sources.forEach(function (source) {
    for (var prop in source) {
      if (source[prop] !== undefined) {
        dest[prop] = source[prop]
      }
    }
  })
  return dest
}

/**
 * Add commas to an integer, so that it's easier to read.
 * @param {Integer} x The number
 * @return {String} The number with commas
 */

util.addCommas = function (x) {
  x += '' // convert to String
  var rgx = /(\d+)(\d{3})/

  while (rgx.test(x)) {
    x = x.replace(rgx, '$1' + ',' + '$2')
  }
  return x
}

if (typeof module !== 'undefined') {
  module.exports = util
  util.extend(util, require('./util-node'))
}