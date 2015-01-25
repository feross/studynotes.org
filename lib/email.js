var config = require('../config')
var debug = require('debug')('studynotes:email')
var nodemailer = require('nodemailer')
var secret = require('../secret')

var transport = nodemailer.createTransport({
  service: 'Gmail',
  auth: secret.gmail
})

var FROM = 'Study Notes <feross@studynotes.org>'
var TO = 'Feross Aboukhadijeh <feross@studynotes.org>'

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
  if (!config.isProd)
    return debug('Skipping email (in dev environment)')

  cb = cb || function () {}

  message.from = FROM
  if (!message.to) message.to = TO

  debug('Sending email: ' + message.subject)

  transport.sendMail(message, cb)
}

exports.notifyAdmin = function (subject, obj) {
  var message = {
    to: TO,
    subject: subject,
    text: obj && JSON.stringify(obj, null, '\t')
  }

  if (obj && obj.name) {
    message.subject += ': ' + obj.name
  }

  if (obj && obj.absoluteUrl) {
    message.text = obj.absoluteUrl + '\n\n' + message.text // prepend
  }

  exports.send(message, function (err) {
    if (err) {
      console.error('ERROR: Could not send admin notification email')
      console.error(err.stack)
    }
  })
}
