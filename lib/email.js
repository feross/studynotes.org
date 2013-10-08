var config = require('../config')
var debug = require('debug')('studynotes:email')
var nodemailer = require('nodemailer')
var secret = require('../secret')

var transport = nodemailer.createTransport('SMTP', {
  service: 'Gmail',
  auth: secret.gmail
})

/**
 * Send an email message.
 *
 *   var message = {
 *     from: '"Feross Aboukhadijeh" <feross@studynotes.org>',
 *     to: '"Feross Aboukhadijeh" <feross@studynotes.org>',
 *     subject: 'Subject',
 *     text: '',
 *     html:'<p><b>Hello</b> to myself</p>'
 *   }
 *
 * @param  {Object}   message
 * @param  {function=} cb
 */
exports.send = function (message, cb) {
  cb || (cb = function () {})

  debug('Sending email: ' + message.subject)

  transport.sendMail(message, cb)
}

var FROM = '"StudyNotes" <feross@studynotes.org>'
var TO = '"Feross Aboukhadijeh" <feross@studynotes.org>'

exports.notifyAdmin = function (subject, obj) {
  var message = {
    from: FROM,
    to: TO,
    subject: subject,
    text: JSON.stringify(obj, null, '\t')
  }

  if (obj.name) {
    message.subject += ': ' + obj.name
  }

  if (obj.absoluteUrl) {
    message.text = obj.absoluteUrl + '\n\n' + message.text // prepend
  }

  exports.send(message)
}

exports.notifyOnException = function (obj) {
  if (!config.isProd) {
    console.log('Not sending exception email because not in prod')
    return
  }

  var message = {
    from: FROM,
    to: TO,
    subject: 'Uncaught Exception',
    text: ''
  }

  if (obj.req) {
    message.subject += ' ' + obj.req.url

    message.text += 'URL: ' + config.siteOrigin + obj.req.url
    message.text += '\n\n'
    message.text += 'HEADERS:'
    message.text += JSON.stringify(obj.req.headers, null, '\t')
    message.text += '\n\n'
  }

  if (obj.err) {
    message.subject += ' [' + obj.err.name + ']'

    message.text += obj.err.stack
    message.text += '\n\n'
  }

  exports.send(message, function (err) {
    if (err) {
      console.error('ERROR: Could not send exception notification email')
      console.error(err)
    }
  })
}