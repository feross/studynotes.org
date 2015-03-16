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

exports.siteOrigin = (isProd ? 'https' : 'http') + '://' + exports.siteHost

exports.cdnOrigin = isProd
  ? 'https://cdn.apstudynotes.org'
  : exports.siteOrigin + '/cdn'

var config = require('./config-node')
extend(exports, config)
