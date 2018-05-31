#!/usr/bin/env node

var MaxCDN = require('maxcdn')
var secret = require('../secret')

var maxcdn = new MaxCDN(
  secret.maxcdn.companyAlias,
  secret.maxcdn.consumerKey,
  secret.maxcdn.consumerSecret
)

maxcdn.del('zones/pull.json/' + secret.maxcdn.zoneId + '/cache', function (err, res) {
  if (err) {
    console.error(err.stack || err.message || err)
    process.exit(1)
  } else if (res.code !== 200) {
    console.error('Non-200 response code: ' + res.code)
    process.exit(1)
  }
})
