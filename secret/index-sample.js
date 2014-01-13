var config = require('../config')

exports.cookieSecret = ''

exports.netdna = {
  companyAlias: '',
  consumerKey: '',
  consumerSecret: '',
  zoneId: ''
}

exports.gmail = {
  user: '',
  pass: ''
}

exports.stripe = {
  secret: config.isProd ? '' : '',
  publishable: config.isProd ? '' : ''
}