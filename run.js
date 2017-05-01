module.exports = run

var downgrade = require('downgrade')
var extend = require('xtend')
var LiveUpdater = require('./liveupdater')
var mail = require('./lib/mail')
var minimist = require('minimist')
var Site = require('./')
var unlimited = require('unlimited')

var argv = minimist(process.argv.slice(2))

/**
 * Run the given server, passing in command line options as options.
 * @param  {function(*)} ServerConstructor
 */
function run (Server) {
  unlimited()

  // Create and start the server
  Server(extend(argv), function (err) {
    if (err) {
      console.error('Error during startup. Abort.')
      console.error(err.stack)
      process.exit(1)
    }
    downgrade()
  })

  process.on('uncaughtException', function (err) {
    console.error('[UNCAUGHT EXCEPTION]')
    console.error(err.stack)
    mail.send({
      subject: '[UNCAUGHT EXCEPTION] ' + err.message,
      text: err.stack.toString()
    })
  })
}

if (!module.parent) {
  run(Site)
  run(LiveUpdater)
}
