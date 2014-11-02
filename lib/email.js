var config = require('../config')
var debug = require('debug')('studynotes:email')
var nodemailer = require('nodemailer')
var secret = require('../secret')

var transport = nodemailer.createTransport({
  service: 'Gmail',
  auth: secret.gmail
})

var FROM = 'StudyNotes <feross@studynotes.org>'
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
  cb || (cb = function () {})
  message.from = FROM

  debug('Sending email: ' + message.subject)

  transport.sendMail(message, cb)
}

exports.notifyAdmin = function (subject, obj) {
  if (!config.isProd)
    return debug('Skipping admin notification email (dev)')

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

exports.notifyOnException = function (obj) {
  var err = obj.err
  var req = obj.req

  if (!config.isProd)
    return debug('Skipping exception notification email (dev)')

  if (err && err.status === 400)
    return console.log('No notify for 400 error (client fault)')

  if (err && err.status === 403)
    return console.log('No notify for 403 error (ignore PROPFIND, POST without CSRF, ...)')

  if (req && /trackback/.test(req.url))
    return console.log('No notify for /trackback/ bots')

  if (req.url === '/robots.txt')
    return console.log('No notify for robots.txt errors')

  var message = {
    to: TO,
    subject: 'Uncaught Exception',
    text: ''
  }

  if (err) {
    message.subject += ' [' + err.name + ']'

    message.text += err.stack
    message.text += '\n\n'

    // Debug
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
      console.error(err.stack)
    }
  })
}
