/*jslint node: true */
"use strict";

var async = require('async')
var beep = require('beepbeep')
var config = require('../config')
var cp = require('child_process')
var debug = require('debug')('builder')
var fs = require('fs')
var md5 = require('MD5')
var mkdirp = require('mkdirp')
var nib = require('nib')
var optimist = require('optimist')
var path = require('path')
var stylus = require('stylus')
var util = require('../util')

var NIB_LIB = path.join(config.root, 'node_modules/nib/lib/nib')
var UGLIFY = path.join(config.root, 'node_modules/.bin/uglifyjs')

/**
 * JS for the site.
 * @type {Array.<string>}
 */
var SITE_JS_FILENAMES = [
  [
    'node_modules/jquery/dist/jquery.js',
    'node_modules/jquery/dist/jquery.min.js'
  ],
  [
    'node_modules/transparency/dist/transparency.js',
    'node_modules/transparency/dist/transparency.min.js'
  ],
  [
    'node_modules/moment/moment.js',
    'node_modules/moment/min/moment.min.js'
  ],
  'node_modules/jquery-placeholder/jquery.placeholder.js',
  'lib/select2/select2.js',
  'node_modules/keymaster/keymaster.js',
  'lib/ckeditor/ckeditor.js',
  'node_modules/engine.io-client/engine.io.js',

  'util.js',
  'util-browser.js',
  'config.js',
  'config-browser.js',

  'static/js/Countdown.js',
  'static/js/browse.js',
  'static/js/search.js',
  'static/js/toolbar.js',
  'static/js/editor.js',
  'static/js/submit-note.js',
  'static/js/socket.js',
  'static/js/main.js'
]

/**
 * Stylus for the site.
 * @type {string}
 */
var SITE_STYLUS_FILENAME = path.join(config.root, 'stylus/main.styl')

// Output filenames
var SITE_JS_OUT = path.join(config.out, 'js/main.js')
var SITE_CSS_OUT = path.join(config.out, 'css/main.css')

exports.build = function (cb) {
  debug('Start building')
  SITE_JS_FILENAMES = SITE_JS_FILENAMES.map(function (filename) {
    if (Array.isArray(filename)) {
      return path.join(config.root, config.isProd ? filename[1] : filename[0])
    } else {
      return path.join(config.root, filename)
    }
  })

  // Ensure build directory exists
  mkdirp(config.out, function (err) {
    if (err) {
      cb(err)
    } else {
      buildSite(function (err, output) {
        if (err) debug('Builder error')
        else debug('Build succeed!')
        cb(err, output)
      })
    }
  })
}

/**
 * Build all web app static resources (stylus, js)
 */
function buildSite (done) {
  var md5s = {}
  async.auto({

    rmOut: function (cb) {
      if (!config.isProd)
        return cb(null)

      cp.exec('rm -r ' + config.out, {}, function (err) {
        if (err) return cb(err)
        mkdirp(config.out, cb)
      })
    },

    // Ensure js/ and css/ folders exist
    mkdir: ['rmOut', function (cb) {
      async.map([
        path.join(config.out, 'js'),
        path.join(config.out, 'css')
      ], mkdirp, cb)
    }],

    // Copy static/* into out/
    copyStatic: ['rmOut', function (cb) {
      cp.exec('cp -r ' + path.join(config.root, 'static') + '/* ' + config.out, {}, cb)
    }],

    // Copy node_modules/* into out/
    copyNodeModules: ['rmOut', function (cb) {
      cp.exec('cp -r ' + path.join(config.root, 'node_modules') + ' ' + config.out, {}, cb)
    }],

    // Copy lib/* into out/
    copyLib: ['rmOut', function (cb) {
      cp.exec('cp -r ' + path.join(config.root, 'lib') + ' ' + config.out, {}, cb)
    }],

    // Build CSS
    css: ['copyStatic', 'mkdir', function (cb) {
      buildStylus(SITE_STYLUS_FILENAME, SITE_CSS_OUT, cb)
    }],

    // Build JS
    js: ['copyStatic', 'mkdir', function (cb) {
      buildJSUglify(SITE_JS_FILENAMES, SITE_JS_OUT, cb)
    }],

    // Calculate MD5 for CSS
    cssMd5: ['css', function (cb) {
      calculateMd5(SITE_CSS_OUT, function (err, md5) {
        md5s.css = md5
        cb(err, md5)
      })
    }],

    // Calculate MD5 for JS
    jsMd5: ['js', function (cb) {
      calculateMd5(SITE_JS_OUT, function (err, md5) {
        md5s.js = md5
        cb(err, md5)
      })
    }],

    removeOldFiles: ['cssMd5', 'jsMd5', function (cb) {
      var command1 = 'rm ' + path.join(config.out, 'js') + '/main-*.js'
      var command2 = 'rm ' + path.join(config.out, 'css') + '/main-*.css'
      // console.log(command1)
      cp.exec(command1, {}, function (err) {
        cp.exec(command2, {}, function (err) {
          // ignore errors - doesn't matter if no file is found
          cb(null)
        })
      })
    }],

    // Copy the CSS file to a file with a unique name, based on the MD5
    cssRename: ['removeOldFiles', function (cb) {
      var base = path.basename(SITE_CSS_OUT, '.css') + '-' + md5s.css + '.css'
      var filename = path.join(path.dirname(SITE_CSS_OUT), base)
      fs.createReadStream(SITE_CSS_OUT)
        .pipe(fs.createWriteStream(filename))
        .on('close', cb)
        .on('error', cb)
    }],

    // Copy the JS file to a file with a unique name, based on the MD5
    jsRename: ['removeOldFiles', function (cb) {
      var base = path.basename(SITE_JS_OUT, '.js') + '-' + md5s.js + '.js'
      var filename = path.join(path.dirname(SITE_JS_OUT), base)
      fs.createReadStream(SITE_JS_OUT)
        .pipe(fs.createWriteStream(filename))
        .on('close', cb)
        .on('error', cb)
    }]
  }, done)
}

/**
 * Compile JS files with the Closure Compiler, and return a string result
 * @param  {Array.<string>} filenames
 * @param  {Object=} closureOpts
 * @param  {function} cb
 */
function buildJSUglify (inFilenames, outFilename, cb) {
  var command = UGLIFY + ' ' + inFilenames.join(' ') +
  (config.isProd ? ' --compress' : ' --beautify') +
  ' -o ' + outFilename
  cp.exec(command, {}, cb)
}

/**
 * Compile stylus files to CSS
 * @param  {function} cb
 */
function buildStylus (inFilename, outFilename, cb) {
  fs.readFile(inFilename, { encoding: 'utf8' }, function (err, source) {
    if (err) return cb(err)
    stylus(source, { filename: inFilename })
      .include(nib.path)
      .define('cdnOrigin', config.cdnOrigin)
      .set('compress', config.isProd)
      .render(function (err, css) {
        if (err) return cb(err)
        fs.writeFile(outFilename, css, cb)
      })
  })
}

/**
 * Generates md5s hashes for compiled resources.
 * @param  {function} cb
 */

function calculateMd5 (filename, cb) {
  fs.readFile(filename, function (err, data) {
    if (err) {
      cb(err)
    } else if (!data) {
      cb(new Error('Cannot generate MD5; no file data for ' + filename))
    } else {
      cb(null, md5(data))
    }
  })
}