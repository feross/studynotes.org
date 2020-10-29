module.exports = LiveUpdater

const arrayRemove = require('unordered-array-remove')
const config = require('../config')
const debug = require('debug')('studynotes:liveupdater')
const http = require('http')
const { JSDOM } = require('jsdom')
const model = require('../model')
const parallel = require('run-parallel')
const run = require('../run')
const throttle = require('throttleit')
const ws = require('ws')

const HOME_UPDATE_THROTTLE = 3000

function LiveUpdater (opts, done) {
  const self = this
  if (!(self instanceof LiveUpdater)) return new LiveUpdater(opts, done)

  self.port = opts.port || 4001

  self.online = {}
  self.titles = {}

  const httpServer = http.createServer()

  self.server = new ws.Server({
    server: httpServer,
    perMessageDeflate: false,
    clientTracking: false
  })

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
      httpServer.listen(self.port, '127.0.0.1', cb)
    }
  ], function (err) {
    if (!err) debug('liveupdater listening on ' + self.port)
    done(err)
  })
}

LiveUpdater.prototype.handleMessage = function (socket, data) {
  const self = this
  let message
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

    const url = socket.url = message.url

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
  const self = this
  const sockets = self.online[socket.url]
  if (sockets) {
    arrayRemove(sockets, sockets.indexOf(socket))
    self.sendUpdates(socket.url)
    self.sendHomeUpdates()
  }
}

LiveUpdater.prototype.getTotalHits = function (cb) {
  const self = this
  parallel(Object.values(model.models).map(function (model) {
    return function (cb) {
      model
        .find()
        .select('hits -_id')
        .exec(cb)
    }
  }), function (err, r) {
    if (err) return cb(err)

    self.totalHits = r.reduce(function (acc, docs) {
      return acc + docs.reduce(function (acc2, doc) {
        return acc2 + (doc.hits || 0)
      }, 0)
    }, 0)

    cb(null)
  })
}

LiveUpdater.prototype.getTotalOnline = function () {
  const self = this
  // Show total users across site on homepage
  let count = 0
  for (const p in self.online) {
    const sockets = self.online[p]
    count += sockets.length
  }
  return count
}

LiveUpdater.prototype.sendStats = function (socket) {
  const self = this

  const stats = {}
  for (const url in self.online) {
    const count = self.online[url].length
    if (count > 0) {
      stats[url] = {
        url: url,
        count: count,
        title: self.getTitle(url)
      }
    }
  }
  const update = {
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
  const self = this
  const sockets = self.online[url]

  self.sendStatsUpdates(url)

  // Early return if there are no updates to send
  if (!sockets || sockets.length === 0) return

  const update = {
    type: 'update',
    count: (url === '/')
      ? self.getTotalOnline()
      : self.online[url].length
  }
  if (url === '/') update.totalHits = self.totalHits

  const message = JSON.stringify(update)
  sockets.forEach(function (socket) {
    send(socket, message)
  })
}

/**
 * Send a special update message to visitors on "/" with `totalHit` value, whenever
 * any visitor (across the site) arrives/leaves, throttled for performance.
 */
LiveUpdater.prototype.sendHomeUpdates = throttle(function () {
  const self = this

  const sockets = self.online['/']

  // Early return if there are no updates to send
  if (!sockets || sockets.length === 0) return

  const update = {
    type: 'update',
    count: self.getTotalOnline(),
    totalHits: self.totalHits
  }

  const message = JSON.stringify(update)
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
  const self = this
  const sockets = self.online['/stats/']

  // Early return if there are no updates to send
  if (!sockets || sockets.length === 0) return

  const update = {
    type: 'statsUpdate',
    totalHits: self.totalHits,

    count: self.online[url].length,
    url: url,
    title: self.getTitle(url)
  }

  const message = JSON.stringify(update)
  sockets.forEach(function (socket) {
    send(socket, message)
  })
}

function send (socket, message) {
  if (socket.readyState === ws.OPEN) socket.send(message)
}

LiveUpdater.prototype.getTitle = function (url) {
  const self = this

  let title = self.titles[url]
  if (title) {
    return title
  } else {
    debug('getTitle: Fetching page title for ' + url)
    JSDOM.fromURL(config.siteOrigin + url).then(dom => {
      const { window } = dom
      const { document } = window

      window.addEventListener('load', () => {
        title = document.querySelector('title').textContent
        if (title === 'Site is under maintenance!') return
        const index = title.indexOf('- Study Notes')
        if (index !== -1) title = title.substring(0, index)

        self.titles[url] = title
        self.sendStatsUpdates(url)
        window.close()
      })
    }, _ => {
      // Handle error, or 404 page
      self.titles[url] = '404 Page Not Found'
      self.sendStatsUpdates(url)
    })
    return url
  }
}

if (!module.parent) run(LiveUpdater)
