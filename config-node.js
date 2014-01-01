/*jslint node: true */

var os = require('os')
var path = require('path')

exports.isProd = (process.env.NODE_ENV === 'production')

exports.root = __dirname
exports.tmp = path.join(exports.root, 'tmp')
exports.out = path.join(exports.root, 'out')

exports.numCpus = exports.isProd
  ? os.cpus().length
  : 1

/**
 * Maximum time to cache static resources (in milliseconds). This value is
 * sent in the HTTP cache-control header. MaxCDN will obey it, caching
 * the file for this length of time as well as passing it along to clients.
 *
 * @type {number}
 */
exports.maxAge = exports.isProd
  ? 7 * 24 * 3600000 // 7 days
  : 0

exports.maxSlugLength = 40

exports.mongo = {
  host: exports.isProd
    ? 'athena.feross.net'
    : 'localhost',
  port: '27017',
  database: 'studynotes'
}

exports.level = path.join(exports.root, 'db/store')
