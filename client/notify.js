var humane = require('humane-js')

var big = humane.create({
  timeout: 4000,
  baseCls: 'humane-jackedup'
})

var small = humane.create({
  clickToClose: true,
  timeout: 4000,
  baseCls: 'humane-libnotify'
})

big.info = big.spawn({ addnCls: 'humane-jackedup-info' })
big.success = big.spawn({ addnCls: 'humane-jackedup-success' })
big.error = big.spawn({
  addnCls: 'humane-jackedup-error',
  timeout: 15000
})

small.info = small.spawn({ addnCls: 'humane-libnotify-info' })
small.success = small.spawn({ addnCls: 'humane-libnotify-success' })
small.error = small.spawn({
  addnCls: 'humane-libnotify-error',
  timeout: 15000
})

exports.big = big
exports.small = small