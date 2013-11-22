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
  if (!config.isProd) {
    console.log('Not sending notification email because not in prod')
    return
  }

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
  var err = obj.err
  var req = obj.req

  if (!config.isProd) return console.log('No notify in dev')
  if (err && err.status === 400) {
    return console.log('No notify for 400 error (client fault)')
  }
  if (req && /trackback/.test(req.url)) {
    return console.log('No notify for /trackback/ bots')
  }

  var message = {
    from: FROM,
    to: TO,
    subject: 'Uncaught Exception',
    text: ''
  }

  if (err) {
    message.subject += ' [' + err.name + ']'

    message.text += err.stack
    message.text += '\n\n'

    // Debug
    message.text += 'Error Code: ' + err.code
    message.text += '\n\n'
    message.text += 'Error object:'
    message.text += JSON.stringify(err)
    message.text += '\n\n'
  }

  if (req) {
    message.subject += ' ' + req.url

    message.text += req.method + ': ' + config.siteOrigin + req.url
    message.text += '\n\n'

    message.text += 'HTTP HEADERS: '
    message.text += JSON.stringify(req.headers, null, '\t')
    message.text += '\n\n'

    if (req.params) {
      message.text += 'HTTP GET PARAMETERS: '
      message.text += JSON.stringify(req.params, null, '\t')
      message.text += '\n\n'
    }

    if (req.body) {
      message.text += 'HTTP BODY: '
      message.text += JSON.stringify(req.body, null, '\t')
    }
  }

  exports.send(message, function (err) {
    if (err) {
      console.error('ERROR: Could not send exception notification email')
      console.error(err)
    }
  })
}