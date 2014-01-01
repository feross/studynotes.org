/*jslint node: true */

var purgeNetDNA = require('purge-netdna')
var secret = require('../secret.js')

purgeNetDNA(secret.netdna, function (err) {
  if (err) throw err
})