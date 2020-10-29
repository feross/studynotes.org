#!/usr/bin/env node

const auto = require('run-auto')
const cp = require('child_process')
const config = require('../config')
const fs = require('fs')
const md5 = require('md5')

auto({
  MD5_JS: function (cb) {
    calculateMd5(config.out + '/main.js', function (err, md5) {
      if (err) throw err
      fs.writeFile(config.out + '/MD5_JS', md5, function (err) {
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
    cp.exec('rm ' + config.out + '/main-*.js', function () {
      // ignore errors - doesn't matter if no file is found
      cb(null)
    })
  },

  removeOldCSS: function (cb) {
    cp.exec('rm ' + config.out + '/main-*.css', function () {
      // ignore errors - doesn't matter if no file is found
      cb(null)
    })
  },

  // Copy the JS file to a file with a unique name, based on the MD5
  jsRename: ['MD5_JS', 'removeOldJS', function (r, cb) {
    const src = config.out + '/main.js'
    const dest = config.out + '/main-' + r.MD5_JS + '.js'
    cp.exec('cp ' + src + ' ' + dest, cb)
  }],

  cssRename: ['MD5_CSS', 'removeOldCSS', function (r, cb) {
    const src = config.out + '/main.css'
    const dest = config.out + '/main-' + r.MD5_CSS + '.css'
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
