var config = require('../config')
var nodemailer = require('nodemailer')

// Create a sendmail transport object
var transport = nodemailer.createTransport('Sendmail', '/usr/sbin/sendmail')

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
  transport.sendMail(message, cb)
}

exports.notifyOnException = function (obj) {
  if (!config.isProd) return

  var message = {
    from: '"StudyNotes Exception" <feross@studynotes.org>',
    to: '"Feross Aboukhadijeh" <feross@studynotes.org>',
    subject: 'Uncaught Exception',
    text: ''
  }

  if (obj.req) {
    message.subject += ' [' + obj.req.url + ']'

    message.text += 'URL: ' + obj.req.url
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