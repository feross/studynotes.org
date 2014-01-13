var async = require('async')
var cp = require('child_process')
var config = require('../config')
var fs = require('fs')
var md5 = require('MD5')

async.auto({
  MD5_JS_MAIN: function (cb) {
    calculateMd5(config.out + '/main.js', function (err, md5) {
      if (err) throw err
      fs.writeFile(config.out + '/MD5_JS_MAIN', md5, function (err) {
        cb(err, md5)
      })
    })
  },

  MD5_JS_EXTRA: function (cb) {
    calculateMd5(config.out + '/extra.js', function (err, md5) {
      if (err) throw err
      fs.writeFile(config.out + '/MD5_JS_EXTRA', md5, function (err) {
        cb(err, md5)
      })
    })
  },

  MD5_CSS: function (cb) {
    calculateMd5(config.out + '/main.css', function (err, md5) {
      if (err) throw err
      fs.writeFile(config.out + '/MD5_CSS', md5, function (err) {
        cb(err, md5)
      })
    })
  },

  removeOldJS: function (cb) {
    // var command2 = 'rm ' + config.out + '/main-*.css'
    cp.exec('rm ' + config.out + '/main-*.js ' + config.out + '/extra-*.js', function (err) {
      // ignore errors - doesn't matter if no file is found
      cb(null)
    })
  },

  removeOldCSS: function (cb) {
    cp.exec('rm ' + config.out + '/main-*.css', function (err) {
      // ignore errors - doesn't matter if no file is found
      cb(null)
    })
  },

  // Copy the JS file to a file with a unique name, based on the MD5
  jsRenameMain: ['MD5_JS_MAIN', 'removeOldJS', function (cb, r) {
    var src = config.out + '/main.js'
    var dest = config.out + '/main-' + r.MD5_JS_MAIN + '.js'
    cp.exec('cp ' + src + ' ' + dest, cb)
  }],

  jsRenameExtra: ['MD5_JS_EXTRA', 'removeOldJS', function (cb, r) {
    var src = config.out + '/extra.js'
    var dest = config.out + '/extra-' + r.MD5_JS_EXTRA + '.js'
    cp.exec('cp ' + src + ' ' + dest, cb)
  }],

  cssRename: ['MD5_CSS', 'removeOldCSS', function (cb, r) {
    var src = config.out + '/main.css'
    var dest = config.out + '/main-' + r.MD5_CSS + '.css'
    cp.exec('cp ' + src + ' ' + dest, cb)
  }]
})

function calculateMd5 (filename, cb) {
  fs.readFile(filename, function (err, data) {
    if (err) return cb(err)
    if (!data) return cb(new Error('MD5 fail; no file data for ' + filename))
    cb(null, md5(data))
  })
}