var config = require('./config')
var fs = require('fs')
var os = require('os')
var path = require('path')

exports.root = __dirname
exports.tmp = path.join(exports.root, 'tmp')
exports.out = path.join(exports.root, 'out')

exports.numCpus = config.isProd
  ? os.cpus().length
  : 1

/**
 * Maximum time to cache static resources (in milliseconds). This value is
 * sent in the HTTP cache-control header. MaxCDN will obey it, caching
 * the file for this length of time as well as passing it along to clients.
 *
 * @type {number}
 */
exports.maxAge = config.isProd
  ? 7 * 24 * 3600000 // 7 days
  : 0

exports.maxSlugLength = 40

exports.mongo = {
  host: config.isProd
    ? 'athena.feross.net'
    : 'localhost',
  port: '27017',
  database: 'studynotes'
}

var MD5_JS_MAIN
var MD5_JS_EXTRA
var MD5_CSS
try {
  if (config.isProd) {
    MD5_JS_MAIN = fs.readFileSync(__dirname + '/out/MD5_JS_MAIN').toString()
    MD5_JS_EXTRA = fs.readFileSync(__dirname + '/out/MD5_JS_EXTRA').toString()
    MD5_CSS = fs.readFileSync(__dirname + '/out/MD5_CSS').toString()
  }
} catch (e) {}

exports.jsMainPath = '/main' + (MD5_JS_MAIN ? '-' + MD5_JS_MAIN : '') + '.js'
exports.jsExtraPath = '/extra' + (MD5_JS_EXTRA ? '-' + MD5_JS_EXTRA : '') + '.js'
exports.cssPath = '/main' + (MD5_CSS ? '-' + MD5_CSS : '') + '.css'