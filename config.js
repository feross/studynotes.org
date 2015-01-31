var extend = require('xtend/mutable')

var isProd = exports.isProd = process.browser
  ? !/^local/.test(window.location.hostname)
  : process.env.NODE_ENV === 'production'

exports.ports = {
  site: isProd ? 7300 : 4000,
  liveupdater: isProd ? 7301 : 4001,
  admin: 4002
}

exports.siteHost = isProd
  ? 'www.apstudynotes.org'
  : 'localhost:' + exports.ports.site

exports.siteOrigin = '//' + exports.siteHost

exports.secureSiteOrigin = (isProd
  ? 'https:'
  : 'http:'
) + exports.siteOrigin

exports.cdnOrigin = isProd
  ? '//cdn.apstudynotes.org'
  : '/cdn'

exports.secureCdnOrigin = (isProd ? 'https:' : '') + exports.cdnOrigin

var config = require('./config-node')
extend(exports, config)
