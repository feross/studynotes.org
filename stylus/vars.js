var config = require('../config')

module.exports = function () {
  return function (style) {
    style.define('cdnOrigin', config.cdnOrigin)
  }
}
