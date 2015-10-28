module.exports = LiveUpdater

var config = require('../config')
var debounce = require('debounce')
var debug = require('debug')('studynotes:liveupdater')
var fs = require('fs')
var http = require('http')
var https = require('https')
var jsdom = require('jsdom')
var model = require('../model')
var parallel = require('run-parallel')
var util = require('../util')
var values = require('object-values')
var ws = require('ws')

var HOME_UPDATE_THROTTLE = 3000

function LiveUpdater (opts, done) {
  var self = this
  self.port = opts.port || config.ports.liveupdater

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

  self.server = new ws.Server({ server: httpServer, perMessageDeflate: false })

  self.server.on('connection', function (socket) {
    socket.destroyed = false
    socket.url = null

    function handleMessage (message) {
      self.handleMessage(socket, message)
    }

    function handleClose () {
      if (socket.destroyed) return
      socket.destroyed = true
      socket.removeListener('message', handleMessage)
      socket.removeListener('error', handleClose)
      socket.removeListener('close', handleClose)
      socket.close()
      self.handleClose(socket)
    }

    socket.on('message', handleMessage)
    socket.on('error', handleClose)
    socket.on('close', handleClose)
  })

  parallel([
    model.connect,
    function (cb) {
      self.getTotalHits(cb)
    },
    function (cb) {
      httpServer.listen(self.port, cb)
    }
  ], function (err) {
    if (!err) debug('liveupdater listening on ' + self.port)
    done(err)
  })
}

LiveUpdater.prototype.handleMessage = function (socket, data) {
  var self = this
  var message
  try {
    debug(data)
    message = JSON.parse(data)
  } catch (e) {
    debug('Discarding non-JSON message: ' + data)
    return
  }

  if (message.type === 'online') {
    // Only accept the first 'online' message
    if (socket.url) return

    // Reject messages without a url
    if (!message.url) return

    var url = socket.url = message.url

    // If this is a new path, create new array
    if (self.online[url] == null) self.online[url] = []

    self.online[url].push(socket)
    self.totalHits += 1

    // If this is the stats page, send the initial stats
    if (url === '/stats/') self.sendStats(socket)

    // Send updates to other users
    self.sendUpdates(url)
    self.sendHomeUpdates()
  } else {
    console.error('Received unknown message type: ' + message.type)
  }
}

LiveUpdater.prototype.handleClose = function (socket) {
  var self = this
  var sockets = self.online[socket.url]
  if (sockets) {
    var index = sockets.indexOf(socket)
    sockets.splice(index, 1)
    self.sendUpdates(socket.url)
    self.sendHomeUpdates()
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
  send(socket, JSON.stringify(update))
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
  if (!sockets || sockets.length === 0) return

  var update = {
    type: 'update',
    count: (url === '/')
      ? self.getTotalOnline()
      : self.online[url].length
  }
  if (url === '/') update.totalHits = self.totalHits

  var message = JSON.stringify(update)
  sockets.forEach(function (socket) {
    send(socket, message)
  })
}

/**
 * Send a special update message to visitors on "/" with `totalHit` value, whenever
 * any visitor (across the site) arrives/leaves, debounced for performance.
 */
LiveUpdater.prototype.sendHomeUpdates = debounce(function () {
  var self = this

  var sockets = self.online['/']

  // Early return if there are no updates to send
  if (!sockets || sockets.length === 0) return

  var update = {
    type: 'update',
    count: self.getTotalOnline(),
    totalHits: self.totalHits
  }

  var message = JSON.stringify(update)
  sockets.forEach(function (socket) {
    send(socket, message)
  })
}, HOME_UPDATE_THROTTLE)

/**
 * Send a special update message to visitors on "/stats/" pages, whenever any
 * visitor (across the site) arrives/leaves.
 * @param  {String} url
 */
LiveUpdater.prototype.sendStatsUpdates = function (url) {
  var self = this
  var sockets = self.online['/stats/']

  // Early return if there are no updates to send
  if (!sockets || sockets.length === 0) return

  var update = {
    type: 'statsUpdate',
    totalHits: self.totalHits,

    count: self.online[url].length,
    url: url,
    title: self.getTitle(url)
  }

  var message = JSON.stringify(update)
  sockets.forEach(function (socket) {
    send(socket, message)
  })
}

function send (socket, message) {
  if (socket.readyState === ws.OPEN) socket.send(message)
}

LiveUpdater.prototype.getTitle = function (url) {
  var self = this

  var title = self.titles[url]
  if (title) {
    return title
  } else {
    debug('getTitle: Fetching page title for ' + url)
    jsdom.env({
      url: config.siteOrigin + url,
      src: [self.jquery],
      done: function (err, window) {
        if (err) return console.error('ERROR: getTitle: ' + err.message)
        title = window.$('title').text()

        if (title === 'Site is under maintenance!') return
        var index = title.indexOf('- Study Notes')
        if (index !== -1) title = title.substring(0, index)

        self.titles[url] = title
        self.sendStatsUpdates(url)
      }
    })
    return url
  }
}

if (!module.parent) util.run(LiveUpdater)
