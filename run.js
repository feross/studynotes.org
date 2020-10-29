require('./rollbar')

module.exports = run

const extend = require('xtend')
const LiveUpdater = require('./liveupdater')
const minimist = require('minimist')
const Site = require('./')

const argv = minimist(process.argv.slice(2))

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
