/*jslint node: true */
/*global app */
"use strict";

// Script to purge the NetDNA CDN cache

var netdna = require('netdna')
var secret = require('./secret.js')

netdna = netdna({
  companyAlias: secret.netdna.companyAlias,
  consumerKey: secret.netdna.consumerKey,
  consumerSecret: secret.netdna.consumerSecret
})

var url = 'zones/pull.json/' + secret.netdna.zoneId + '/cache'
netdna.delete(url, function (err, response) {
  if (err || response.code !== 200) {
    console.error('Response code: ' + response.code)
    console.dir(err)
  }
})