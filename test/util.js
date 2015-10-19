var proxyquire = require('proxyquire')
var test = require('tape')
var util = proxyquire('../util', {
  '../secret': {
    '@noCallThru': true,
    '@global': true
  }
})

test('util.hitsPerDay', function (t) {
  var date = Date.now() - (1000 * 60 * 60 * 24) // 1 day ago
  var hits = 1000
  t.equal(util.hitsPerDay(hits, date), 1000)
  t.end()
})

test('util.sanitizeHTML', function (t) {
  // <script> tag is removed
  var html = 'Hello<script>alert("hi")</script> world'
  t.equal(util.sanitizeHTML(html), 'Hello world')

  // <p>, <h1>, <div> are allowed
  html = '<div><p><h1>Hello world</h1></p></div>'
  t.equal(util.sanitizeHTML(html), html) // unchanged
  t.end()
})

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

test('util.addQueryParams', function (t) {
  t.equal(
    util.addQueryParams('http://host.com/?a=1', { b: 2 }),
    'http://host.com/?a=1&b=2'
  )
  t.equal(
    util.addQueryParams('http://host.com/?a=1&b=2', { b: 3 }),
    'http://host.com/?a=1&b=3'
  )
  t.end()
})
