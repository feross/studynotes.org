const path = require('path')
const pug = require('pug')

const config = require('../config')

const NATIVE_AD_PATH = path.join(config.root, 'views', 'ads', 'adsense-native-in-content.pug')

const PUG_OPTS = {
  cache: true,
  compileDebug: false,
  filename: NATIVE_AD_PATH
}

module.exports = function (body, locals) {
  let ret
  ret = insertAfterParagraph(body, locals)
  if (ret == null) ret = insertAfterListItem(body, locals)
  if (ret == null) ret = body
  return ret
}

function insertAfterParagraph (body, locals) {
  const startTag = '<p>'
  const endTag = '</p>'

  let index = body.indexOf(endTag)
  if (index === -1) return null
  for (let i = 0; i < 2; i++) {
    index = body.indexOf(endTag, index + endTag.length)
    if (index === -1) return null
  }

  return body.slice(0, index + endTag.length) +
    startTag + getAd(locals) + endTag +
    body.slice(index + endTag.length)
}

function insertAfterListItem (body, locals) {
  const startTag = '<li>'
  const endTag = '</li>'

  let index = body.indexOf(endTag)
  if (index === -1) return null
  for (let i = 0; i < 10; i++) {
    index = body.indexOf(endTag, index + endTag.length)
    if (index === -1) return null
  }

  return body.slice(0, index + endTag.length) +
    startTag + getAd(locals) + endTag +
    body.slice(index + endTag.length)
}

function getAd (locals) {
  return pug.renderFile(NATIVE_AD_PATH, Object.assign({}, PUG_OPTS, locals))
}
