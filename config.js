var util = require('./util')

exports.isProd = process.browser
  ? !/^local/.test(window.location.hostname)
  : (process.env.NODE_ENV === 'production')

exports.ports = {
  site: exports.isProd ? 7300 : 4000,
  liveupdater: exports.isProd ? 7301 : 4001,
  admin: 4002
}

exports.siteOrigin = exports.isProd
  ? 'http://www.apstudynotes.org'
  : process.browser
    ? window.location.origin
    : 'http://localhost:' + exports.ports.site

exports.cdnOrigin = exports.isProd
  ? 'http://cdn.apstudynotes.org'
  : '/cdn'

util.extend(exports, require('./config-' + (process.browser ? 'browser' : 'node')))