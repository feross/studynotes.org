var purgeNetDNA = require('purge-netdna')
var secret = require('../secret')

purgeNetDNA(secret.netdna, function (err) {
  if (err) throw err
})