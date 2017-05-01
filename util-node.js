var crypto = require('crypto')
var htmlParser = require('html-parser')
var jsdom = require('jsdom')
var loremIpsum = require('lorem-ipsum')
var mail = require('./lib/mail')

exports.truncate = require('html-truncate')

/**
 * Returns hits per day, given the total `hits` and the `date` of publication.
 * @param  {number} hits
 * @param  {Date|number} date
 * @return {number}
 */
exports.hitsPerDay = function (hits, date) {
  var days = (Date.now() - new Date(date)) / 86400000
  days = days || 0.00001 // prevent divide by zero
  return Math.round(hits / days)
}

var defaultElementsWhitelist = [
  'p', 'br',
  'strong', 'b', 'em', 'i', 'u',
  'ol', 'ul', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'div', 'span',
  'sub', 'sup'
]

var defaultAttributesWhitelist = [

]

/**
 * Sanitize dirty (user-provided) HTML to remove bad html tags. Uses a
 * whitelist approach, where only the tags we explicitly allow are kept.
 *
 * @param  {String} html                dirty HTML
 * @param  {Array=} elementsWhitelist   elements to keep
 * @param  {Array=} attributesWhitelist attributes to keep
 * @return {String}                     sanitized HTML
 */
exports.sanitizeHTML = function (html, elementsWhitelist, attributesWhitelist) {
  elementsWhitelist || (elementsWhitelist = defaultElementsWhitelist)
  attributesWhitelist || (attributesWhitelist = defaultAttributesWhitelist)

  var sanitized = htmlParser.sanitize(html, {
    elements: function (name) {
      return elementsWhitelist.indexOf(name) === -1
    },
    attributes: function (name) {
      return attributesWhitelist.indexOf(name) === -1
    },
    comments: true,
    doctype: true
  })
  return sanitized
}

exports.randomBytes = function (length, cb) {
  if (typeof length === 'function') {
    cb = length
    length = 20
  }
  if (!cb) throw new Error('argument cb required')

  crypto.randomBytes(length, function (err, buf) {
    if (err) return cb(err)
    cb(null, buf.toString('hex'))
  })
}

exports.convertToPaywallText = function (html, numPreview, cb) {
  jsdom.env(html, function (err, window) {
    if (err) return cb(err)
    var document = window.document
    var nodes = document.querySelectorAll(
      'body > :not(:first-child):not(:nth-child(2))'
    )

    Array.from(nodes).forEach(function (node) {
      var words = node.innerHTML.split(' ').length
      var sentences = node.innerHTML.split('. ').length
      node.innerHTML = loremIpsum({
        count: sentences,
        sentenceLowerBound: Math.floor((words / sentences) / 1.5),
        sentenceUpperBound: Math.ceil(words / sentences)
      })
    })

    cb(null, document.querySelector('body').innerHTML)
  })
  return html
}

exports.registerUncaughtException = function () {
  process.on('uncaughtException', function (err) {
    console.error('[UNCAUGHT EXCEPTION]')
    console.error(err.stack)
    mail.send({
      subject: '[UNCAUGHT EXCEPTION] ' + err.message,
      text: err.stack.toString()
    }, function (err) {
      if (err) console.error('Email notification failed to send. ' + err.stack)

      // Do not continue processes in undefined state after 'uncaughtException'
      process.exit(1)
    })
  })
}
