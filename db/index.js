module.exports = DB

var async = require('async')
var config = require('../config')
var cp = require('child_process')
var debug = require('debug')('studynotes:db')
var fs = require('fs')
var liveStream = require('level-live-stream')
var levelup = require('levelup')
var multilevel = require('multilevel')
var net = require('net')
var once = require('once')
var path = require('path')
var util = require('../util')

/**
 * Multilevel server
 * @param {Object}   opts
 * @param {function(Error)} cb
 */
function DB (opts, cb) {
  var self = this
  opts || (opts = {})
  /** @type {number} port */ opts.port || (opts.port = config.ports.db)

  util.extend(self, opts)
  self.start(cb)
}

DB.prototype.start = function (cb) {
  var self = this
  self.db = levelup(config.level, {
    valueEncoding: 'json'
  })

  liveStream.install(self.db)

  if (!config.isProd) {
    multilevel.writeManifest(self.db, path.join(config.root, 'db/manifest.json'))
  }

  self.server = net.createServer(function (con) {
    con.pipe(multilevel.server(self.db)).pipe(con)
  })
  self.server.listen(self.port, cb)
}

/**
 * Called by a client to create a socket to the multilevel DB.
 */
module.exports.connect = function (cb) {
  var manifest = require(path.join(config.root, 'db/manifest.json'))
  var db = addDbMethods(multilevel.client(manifest))

  var con = net.connect(config.ports.db)
  con.pipe(db.createRpcStream()).pipe(con)

  var onConnect = once(function (err) {
    cb(err, db)
  })
  con.on('connect', onConnect)
  con.on('error', onConnect)

  return db
}

function addDbMethods (db) {

  function processOpts (opts) {
    // `prefix` is a shorthand to set `start` and `end` to fetch everything with
    // a given prefix
    if (opts.prefix && !opts.start && !opts.end) {
      opts.start = opts.prefix
      opts.end = opts.prefix + '\xFF'
      delete opts.prefix
    }
    return opts
  }

  /**
   * Count the number of entries that match the search options.
   * @param  {Object}   opts
   * @param  {function(Error, number)} cb
   */
  db.count = function (opts, cb) {
    opts = processOpts(opts)
    cb = once(cb)
    var count = 0

    db.createReadStream(opts)
      .on('data', function () {
        count += 1
      })
      .on('close', function () {
        cb(null, count)
      })
      .on('error', cb)
  }

  /**
   * Get entries that match the search options, buffer up the result, and call
   * a callback with the whole buffer.
   * @param  {Object}   opts
   * @param  {function(Error, Array.<*>)} cb
   */
  db.concat = function (opts, cb) {
    opts = processOpts(opts)
    cb = once(cb)

    var arr = []
    db.createReadStream(opts)
      .on('data', function (data) {
        arr.push(data)
      })
      .on('close', function () {
        cb(null, arr)
      })
      .on('error', cb)
  }

  return db
}

if (!module.parent) {
  util.run(DB)
}