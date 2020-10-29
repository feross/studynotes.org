const crypto = require('crypto')
const htmlParser = require('html-parser')
const { JSDOM } = require('jsdom')
const { loremIpsum } = require('lorem-ipsum')

exports.truncate = require('html-truncate')

/**
 * Returns hits per day, given the total `hits` and the `date` of publication.
 * @param  {number} hits
 * @param  {Date|number} date
 * @return {number}
 */
exports.hitsPerDay = function (hits, date) {
  let days = (Date.now() - new Date(date)) / 86400000
  days = days || 0.00001 // prevent divide by zero
  return Math.round(hits / days)
}

const defaultElementsWhitelist = [
  'p', 'br',
  'strong', 'b', 'em', 'i', 'u',
  'ol', 'ul', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'div', 'span',
  'sub', 'sup'
]

const defaultAttributesWhitelist = [

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

  const sanitized = htmlParser.sanitize(html, {
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

exports.convertToPaywallText = function (html, numPreview) {
  const { window } = new JSDOM(html)
  const { document } = window

  const nodes = document.querySelectorAll(
    'body > :not(:first-child):not(:nth-child(2))'
  )

  Array.from(nodes).forEach(function (node) {
    const words = node.innerHTML.split(' ').length
    const sentences = node.innerHTML.split('. ').length
    node.innerHTML = loremIpsum({
      count: sentences,
      sentenceLowerBound: Math.floor((words / sentences) / 1.5),
      sentenceUpperBound: Math.ceil(words / sentences)
    })
  })

  const paywallText = document.querySelector('body').innerHTML
  window.close()
  return paywallText
}
