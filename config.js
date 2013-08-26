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

exports.siteTitle = 'Study Notes'
exports.siteOrigin = 'https://essaysite.com' // no trailing slash

exports.cookieSecret = 'GRyXK3xSJ59HfLbl9aLKaDNn6Knz1k'

exports.root = __dirname
exports.out = path.join(__dirname, 'static', 'out')
exports.tmp = path.join(__dirname, 'tmp')