require('./rollbar')

module.exports = run

var extend = require('xtend')
var LiveUpdater = require('./liveupdater')
var minimist = require('minimist')
var Site = require('./')
// var util = require('./util')

var argv = minimist(process.argv.slice(2))

/**
 * Run the given server, passing in command line options as options.
 * @param  {function(*)} ServerConstructor
 */
function run (runServer) {
  // Create and start the server
  runServer(extend(argv), function (err) {
    if (err) {
      console.error('Error during startup. Abort.')
      console.error(err.stack)
      process.exit(1)
    }
  })
}

if (!module.parent) {
  run(Site)
  run(LiveUpdater)
}
