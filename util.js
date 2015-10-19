var extend = require('xtend/mutable')
var url = require('url')

module.exports = exports = require('./util-node')

exports.addCommas = require('add-commas')

/**
 * Add query parameters to a URL.
 *   Example: addQueryParams('http://host.com/?a=1', { b: 2 })
 *   Returns: 'http://host.com/?a=1&b=2'
 * @param {string} u
 * @param {Object} params
 */
exports.addQueryParams = function (u, params) {
  u = url.parse(u, true)
  extend(u.query, params)
  u.search = null
  return url.format(u)
}
