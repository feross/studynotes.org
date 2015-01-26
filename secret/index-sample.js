//
// REMEMBER TO MANUALLY UPLOAD THIS TO THE SERVER
//

var config = require('../config')

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

exports.stripe = {
  secret: config.isProd ? '' : '',
  publishable: config.isProd ? '' : ''
}
