// Dependencies
var child_process = require('child_process')

// Paths to command-line programs
var STYLUS_BINARY = './node_modules/stylus/bin/stylus'
  , NIB_BINARY = './node_modules/nib/lib/nib'


/**
 * Build all app static resources (Stylus, JS contcatenation & minification)
 * @param  {Function} cb Called when done
 */
exports.buildAll = function (cb) {
  exports.buildStylus(function (err) {
    if (err) {
      error(err)
      cb('Building static resources failed. Can\'t proceed')
      return
    }

    cb(null)
  })
}

/**
 * Compile stylus files to CSS
 * @param  {Function} cb
 */
exports.buildStylus = function (cb) {
  var command = 'rm -rf static/css; mkdir -p static/css; ' + STYLUS_BINARY + ' stylus/main.styl ' + '--use ' + NIB_BINARY + (PRODUCTION ? ' --compress' : '') + ' --out static/css'

  child_process.exec(command, { cwd: __dirname }, function(err, stdout, stderr){
    cb(err)
  })
}

