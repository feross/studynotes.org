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
  let index = body.indexOf('</p>')
  if (index === -1) return null

  for (let i = 0; i < 2; i++) {
    index = body.indexOf('</p>', index + 4)
    if (index === -1) return null
  }

  return body.slice(0, index + 4) + '<p>' + getAd(locals) + '</p>' + body.slice(index + 4)
}

function insertAfterListItem (body, locals) {
  let index = body.indexOf('</li>')
  if (index === -1) return null

  for (let i = 0; i < 10; i++) {
    index = body.indexOf('</li>', index + 4)
    if (index === -1) return null
  }

  return body.slice(0, index + 4) + '<li>' + getAd(locals) + '</li>' + body.slice(index + 4)
}

function getAd (locals) {
  return pug.renderFile(NATIVE_AD_PATH, Object.assign({}, PUG_OPTS, locals))
}
