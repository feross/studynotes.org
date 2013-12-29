/*jslint node: true */

// Configuration settings. For node and the browser.

var config = {}

config.isNode = (typeof module !== 'undefined')

config.isProd = config.isNode
  ? (process.env.NODE_ENV === 'production')
  : !/^local/.test(window.location.hostname)

config.ports = {
  site: config.isProd ? 7300 : 4000,
  liveupdater: config.isProd ? 7301 : 4001,
  admin: 4002
}

config.siteOrigin = config.isProd
  ? 'http://www.apstudynotes.org'
  : config.isNode
    ? 'http://localhost:' + config.ports.site
    : window.location.origin

config.cdnOrigin = config.isProd
  ? 'http://cdn.apstudynotes.org'
  : '/out'

if (typeof module !== 'undefined') {
  module.exports = config
  require('./util').extend(config, require('./config-node'))
}