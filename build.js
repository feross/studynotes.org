// Dependencies
var child_process = require('child_process')
  , fs = require('fs')
  , path = require('path')
  , async = require('async')
  , _ = require('underscore')
  , md5 = require('MD5')

// Constants
var STYLUS = './node_modules/stylus/bin/stylus'
  , NIB = './node_modules/nib/lib/nib'
  , UGLIFY = './node_modules/uglify-js/bin/uglifyjs'
  , OUT_PATH = 'static/build'

/**
 * List of all client JS files.
 * @type {Array}
 */
exports.JS_FILENAMES = [
  [
    'components/jquery/jquery.js',
    'components/jquery/jquery.min.js'
  ]
  , [
    'components/underscore/underscore.js',
    'components/underscore/underscore-min.js'
  ]
  , [
    'components/transparency/lib/transparency.js',
    'components/transparency/lib/transparency.min.js'
  ]
  , [
    'components/keymaster/keymaster.js',
    'components/keymaster/keymaster.min.js'
  ]
  , 'components/moment/moment.js'
  , 'js/util.js'
  , 'js/countdown.js'
  , 'js/client.js'
]

exports.JS_FILENAMES = _.map(exports.JS_FILENAMES, function (file) {
  if (_.isArray(file)) {
    return PRODUCTION ? file[1] : file[0]
  } else {
    return file
  }
})

var COMPILED_PATHS = {
  css: OUT_PATH + '/css/main.css',
  js: OUT_PATH + '/js/main.js'
}


/**
 * Build all app static resources (Stylus, JS contcatenation & minification)
 * @param  {Function} cb
 */
exports.buildAll = function (cb) {
  async.auto({
      makeBuildDir: exports.makeBuildDir
    , buildStylus: ['makeBuildDir', exports.buildStylus]
    , buildJS: ['makeBuildDir', exports.buildJS]
    , generateMd5s: ['makeBuildDir', 'buildStylus', 'buildJS', exports.generateMd5s]
    , renameToMd5s: ['makeBuildDir', 'buildStylus', 'buildJS', 'generateMd5s', exports.renameToMd5s]
  }, function(err, results) {
    if (err) {
      error(err)
      cb('Building static resources failed.')
    } else {
      var md5s = results.generateMd5s
      cb(null, md5s)
    }
  })

}

/**
 * Delete and re-create the directory where static resources will be stored.
 * @param  {Function} cb
 */
exports.makeBuildDir = function (cb) {
  var command = 'rm -rf ' + OUT_PATH + '; mkdir -p ' + OUT_PATH + '/css; mkdir -p ' + OUT_PATH + '/js;'
  child_process.exec(command, { cwd: __dirname }, cb)
}

/**
 * Compile stylus files to CSS
 * @param  {Function} cb
 */
exports.buildStylus = function (cb) {
  var command = STYLUS + ' stylus/main.styl ' + '--use ' + NIB + (PRODUCTION ? ' --compress' : '') + ' --out ' + OUT_PATH+'/css'
  child_process.exec(command, { cwd: __dirname }, cb)
}

/**
 * Concat and minify JS files
 * @param  {Function} cb
 */
exports.buildJS = function (cb) {
  // Don't compile JS while developing. We include scripts individually in `layout.jade`.
  if (!PRODUCTION) {
    cb(null)
    return
  }

  var prefix = 'static/'
  var files = _.map(exports.JS_FILENAMES, function (file) {
    if (_.isArray(file)) {
      return prefix + (PRODUCTION ? file[1] : file[0])
    } else {
      return prefix + file
    }
  })

  var command = UGLIFY + ' ' + files.join(' ') + ' -c -o ' + OUT_PATH+'/js/main.js'
  child_process.exec(command, { cwd: __dirname }, cb)
}

/**
 * Generates md5s for the compiled JS and CSS resources.
 * (Note: filenames are hardcoded.)
 * 
 * @param  {Function} cb
 */
exports.generateMd5s = function (cb) {
  async.parallel({
    css: fs.readFile.bind(undefined, path.join(__dirname, COMPILED_PATHS.css)),
    js: function (cb) {
      if (PRODUCTION) {
        fs.readFile(path.join(__dirname, COMPILED_PATHS.js), cb)
      } else {
        cb(null)
      }
    }
  }, function(err, results) {
    if (err) {
      error(err)
      return
    }

    var md5s = {}
    _.each(results, function (fileData, resourceType) {
      if (!fileData) return
      md5s[resourceType] = md5(fileData)
    })

    cb(null, md5s)
  })

}

/**
 * Renames the compiled JS and CSS resources to include their MD5 checksums
 * in the filename.
 * @param  {Function} cb
 * @param  {Object}   results   Results of functions that have been completed from the `async.auto` call in `buildAll`
 *                              See: https://github.com/caolan/async#auto
 */
exports.renameToMd5s = function (cb, results) {
  md5s = _.pairs(results.generateMd5s)
  async.forEach(md5s, function (md5Pair, cb) {
    var resourceType = md5Pair[0]
      , md5 = md5Pair[1]
      , re = new RegExp('\.' + resourceType + '$', 'i')
      , oldFilename = COMPILED_PATHS[resourceType]
      , newFilename = COMPILED_PATHS[resourceType].replace(re, '-' + md5 + '.' + resourceType)
    
    var command = 'cp ' + oldFilename + ' ' + newFilename
    child_process.exec(command, { cwd: __dirname }, cb)
  }, cb)
}

