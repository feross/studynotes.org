//
// REMEMBER TO MANUALLY UPLOAD THIS TO THE SERVER
//

exports.cookieSecret = 'abcdefghijklmnopqrstuvabcdefghi'

exports.maxcdn = {
  companyAlias: '',
  consumerKey: '',
  consumerSecret: '',
  zoneId: ''
}

exports.gmail = {
  user: '',
  pass: ''
}

// Keep here, because circular dep
var config = require('../config')

exports.stripe = config.isProd
  ? ''
  : ''

exports.mongo = {
  host: config.isProd ? '' : '',
  port: '',
  database: ''
}

exports.mailchimp = {
  key: '',
  list: ''
}

exports.rollbar = {
  accessToken: 'TODO'
}
