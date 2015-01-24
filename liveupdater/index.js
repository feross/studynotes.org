module.exports = LiveUpdater

var config = require('../config')
var debug = require('debug')('studynotes:liveupdater')
var extend = require('extend.js')
var fs = require('fs')
var http = require('http')
var https = require('https')
var jsdom = require('jsdom')
var model = require('../model')
var parallel = require('run-parallel')
var series = require('run-series')
var util = require('../util')
var values = require('object-values')
var ws = require('ws')

function LiveUpdater (opts, done) {
  var self = this
  if (opts) extend(self, opts)
  done || (done = function () {})

  /** @type {number} port */
  self.port || (self.port = config.ports.liveupdater)
  self.online = {}
  self.titles = {}

  self.jquery = fs.readFileSync(
    config.root + '/node_modules/jquery/dist/jquery.min.js',
    { encoding: 'utf8' }
  )

  var httpServer = config.isProd
    ? https.createServer({
      key: fs.readFileSync(config.root + '/secret/apstudynotes.org.key'),
      cert: fs.readFileSync(config.root + '/secret/apstudynotes.org.chained.crt')
    })
    : http.createServer()

  httpServer.listen(self.port)
  self.server = new ws.Server({ server: httpServer })

  self.server.on('connection', function (socket) {
    socket.on('message', self.handleMessage.bind(self, socket))
    socket.on('error', self.handleClose.bind(self, socket))
    socket.on('close', self.handleClose.bind(self, socket))
    socket.onSend = self.handleSend.bind(self, socket)
  })

  series([
    model.connect,
    function (cb) {
      self.getTotalHits(cb)
    }
  ], function (err) {
    if (!err) debug('StudyNotes listening on ' + self.port)
    done(err)
  })
}

LiveUpdater.prototype.handleMessage = function (socket, data) {
  var self = this
  var message
  try {
    debug('Received message: ' + data)
    message = JSON.parse(data)
  } catch (e) {
    debug('Discarding non-JSON message: ' + data)
    return
  }

  if (message.type === 'online') {
    // Only accept the first 'online' message
    if (socket.url)
      return

    var url = socket.url = message.url

    // If this is a new path, create new array
    if (self.online[url] === undefined) {
      self.online[url] = []
    }

    self.online[url].push(socket)
    self.totalHits += 1

    // If this is the stats page, send the initial stats
    if (url === '/stats/') {
      self.sendStats(socket)
    }

    // Send updates to other users
    self.sendUpdates(url)
    self.sendHomeUpdates()
  } else {
    console.error('Received unknown message type: ' + message.type)
  }
}

LiveUpdater.prototype.handleSend = function (socket, err) {
  var self = this
  if (err) {
    console.error('Socket error: ' + err.message)
    self.handleClose(socket)
  }
}

LiveUpdater.prototype.handleClose = function (socket) {
  var self = this
  var url = socket.url
  var sockets = self.online[url]

  if (sockets) {
    var index = sockets.indexOf(socket)
    sockets.splice(index, 1)
    self.sendUpdates(url)
  }
}

LiveUpdater.prototype.getTotalHits = function (cb) {
  var self = this
  parallel(values(model.models).map(function (model) {
    return function (cb) {
      model
        .find()
        .select('hits -_id')
        .exec(cb)
    }
  }), function (err, results) {
    if (err) return cb(err)

    self.totalHits = results.reduce(function (acc, docs) {
      return acc + docs.reduce(function (acc2, doc) {
        return acc2 + (doc.hits || 0)
      }, 0)
    }, 0)

    cb(null)
  })
}

LiveUpdater.prototype.getTotalOnline = function () {
  var self = this
  // Show total users across site on homepage
  var count = 0
  for (var p in self.online) {
    var sockets = self.online[p]
    count += sockets.length
  }
  return count
}

LiveUpdater.prototype.sendStats = function (socket) {
  var self = this

  var stats = {}
  for (var url in self.online) {
    var count = self.online[url].length
    if (count > 0) {
      stats[url] = {
        url: url,
        count: count,
        title: self.getTitle(url)
      }
    }
  }
  var update = {
    type: 'stats',
    stats: stats
  }
  socket.send(JSON.stringify(update), socket.onSend)
}

/**
 * Send updates whenever a visitor arrives/leaves a particular page.
 * @param  {String} url
 */
LiveUpdater.prototype.sendUpdates = function (url) {
  var self = this
  var sockets = self.online[url]

  self.sendStatsUpdates(url)

  // Early return if there are no updates to send
  if (!sockets || sockets.length === 0)
    return

  var update = {
    type: 'update',
    count: (url === '/')
      ? self.getTotalOnline()
      : self.online[url].length
  }

  var message = JSON.stringify(update)
  sockets.forEach(function (socket) {
    socket.send(message, socket.onSend)
  })
}

/**
 * Send a special update message to visitors on "/" with `totalHit` value,
 * whenever any visitor (across the site) arrives/leaves.
 */
LiveUpdater.prototype.sendHomeUpdates = function () {
  var self = this

  var sockets = self.online['/']

  // Early return if there are no updates to send
  if (!sockets || sockets.length === 0)
    return

  var update = {
    type: 'update',
    totalHits: self.totalHits
  }

  var message = JSON.stringify(update)
  sockets.forEach(function (socket) {
    socket.send(message, socket.onSend)
  })
}

/**
 * Send a special update message to visitors on "/stats/" pages, whenever any
 * visitor (across the site) arrives/leaves.
 * @param  {String} url
 */
LiveUpdater.prototype.sendStatsUpdates = function (url) {
  var self = this
  var sockets = self.online['/stats/']

  // Early return if there are no updates to send
  if (!sockets || sockets.length === 0)
    return

  var update = {
    type: 'statsUpdate',
    totalHits: self.totalHits,

    count: self.online[url].length,
    url: url,
    title: self.getTitle(url)
  }

  var message = JSON.stringify(update)
  sockets.forEach(function (socket) {
    socket.send(message, socket.onSend)
  })
}

LiveUpdater.prototype.getTitle = function (url) {
  var self = this

  var title = self.titles[url]
  if (title) {
    debug('getTitle: Using cached title for ' + url)
    return title
  } else {
    debug('getTitle: Fetching page title for ' + url)
    jsdom.env({
      url: 'http:' + config.siteOrigin + url,
      src: [self.jquery],
      done: function (err, window) {
        if (err) return console.error('ERROR: getTitle: ' + err.message)
        title = window.$('title').text()

        if (title === 'Site is under maintenance!')
          return
        var index = title.indexOf('- Study Notes')
        if (index !== -1)
          title = title.substring(0, index)

        self.titles[url] = title
        self.sendStatsUpdates(url)
      }
    })
    return url
  }
}

if (!module.parent) util.run(LiveUpdater)
