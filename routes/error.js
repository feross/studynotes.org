/* jshint -W098 */

var debug = require('debug')('studynotes:routes/error')
var email = require('../lib/email')
var httpStatus = require('http-status-codes')

module.exports = function (app) {
  app.get('/500', function (req, res, next) {
    next(new Error('Manually visited /500'))
  })

  app.use(function (req, res) {
    res.status(404).render('error', {
      title: '404 Page Not Found',
      hero: {
        title: '404 Page Not Found',
        desc: 'Sorry about that. Here is a cat for you instead.'
      }
    })
  })

  app.use(function (err, req, res, next) {
    var text = '\n=== EXCEPTION ===\n' +
      req.method + ': ' + req.url + '\n' +
      err.stack + '\n' +
      'Headers:' + '\n' +
      JSON.stringify(req.headers, undefined, 4) + '\n' +
      (req.params && Object.keys(req.params).length
        ? 'GET Params:' + '\n' +
          JSON.stringify(req.params, undefined, 4) + '\n'
        : '') +
      (req.body && Object.keys(req.body).length
        ? 'Body:' + '\n' +
          JSON.stringify(req.body, undefined, 4) + '\n'
        : '')

    console.error(text)

    var code = 500
    if (typeof err.status === 'number') {
      code = err.status
    }

    res.status(code)

    if (code === 400) {
      debug('No notify for 400 error (client fault)')
    } else if (code === 403) {
      debug('No notify for 403 error (ignore PROPFIND, POST without CSRF, ...)')
    } else if (/trackback/.test(req.url)) {
      debug('No notify for /trackback/ bots')
    } else if (req.url === '/robots.txt') {
      debug('No notify for robots.txt errors')
    } else {
      email.send({
        subject: err.message,
        text: text
      })
      res.render('error', {
        title: code + ' ' + httpStatus.getStatusText(code),
        hero: {
          title: code + ' ' + httpStatus.getStatusText(code),
          desc: 'Sorry about that. Here is a cat for you instead.'
        }
      })
      return
    }
    res.send()
  })
}

/* jshint +W098 */
