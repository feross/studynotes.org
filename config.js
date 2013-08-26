var os = require('os')
var path = require('path')

exports.isProd = (process.env.NODE_ENV === 'production')

exports.port = 4000

exports.db = {
  host: exports.isProd
    ? 'athena.feross.net'
    : 'localhost',
  port: '27017',
  database: 'studynotes'
}

exports.siteOrigin = 'http://www.apstudynotes.org' // no trailing slash

exports.root = __dirname
exports.out = path.join(__dirname, 'static', 'out')
exports.tmp = path.join(__dirname, 'tmp')

exports.numCluster = exports.isProd
  ? os.cpus().length
  : 1