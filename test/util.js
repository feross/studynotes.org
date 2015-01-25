var util = require('../util')
var test = require('tape')

test('util.randomBytes', function (t) {
  t.plan(2)

  util.randomBytes(function (err, bytes) {
    if (err) throw err
    t.equal(new Buffer(bytes, 'hex').length, 20, 'default length is 20')
  })

  util.randomBytes(10, function (err, bytes) {
    if (err) throw err
    t.equal(new Buffer(bytes, 'hex').length, 10, 'explicit length')
  })
})
