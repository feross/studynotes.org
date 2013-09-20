/**
 * Configuration settings. For node and the browser.
 */

var config = {}

// No configs here yet!
// config.blah = 99

// For Node environment
if (typeof module !== 'undefined') {
  module.exports = config
  require('./util').extend(config, require('./config-node'))
}
