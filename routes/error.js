var httpStatus = require('http-status-codes')

module.exports = function (app) {
  app.get('/500', function (req, res, next) {
    const err = new Error('Manually visited /500')
    err.status = 500
    next(err)
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

  if (global.rollbar) app.use(global.rollbar.errorHandler())

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
        : '') +
      (req.session && Object.keys(req.session).length
        ? 'Session:' + '\n' +
          JSON.stringify(req.session, undefined, 4) + '\n'
        : '')

    console.error(text)

    var code = 500
    if (typeof err.status === 'number') {
      code = err.status
    }

    res.status(code)
    res.render('error', {
      title: code + ' ' + httpStatus.getStatusText(code),
      hero: {
        title: code + ' ' + httpStatus.getStatusText(code),
        desc: 'Sorry about that. Here is a cat for you instead.'
      }
    })
  })
}
