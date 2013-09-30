module.exports = LiveUpdater

var config = require('../config')
var debug = require('debug')('studynotes:liveupdater')
var engine = require('engine.io')
var util = require('../util')

function LiveUpdater (opts, cb) {
  var self = this
  if (opts) util.extend(self, opts)

  /** @type {number} port */
  self.port || (self.port = config.ports.liveupdater)
  self.online = {}

  self.start(cb)
}

LiveUpdater.prototype.start = function (cb) {
  var self = this
  cb || (cb = function () {})

  self.engine = engine.listen(self.port)
  self.engine.on('connection', function (socket) {
    socket.on('message', self.onSocketMessage.bind(self, socket))
    socket.on('close', self.onSocketClose.bind(self, socket))
  })
}

LiveUpdater.prototype.getOnlineCount = function (pathname) {
  var self = this

  if (pathname === '/') {
    // Show total users across site on homepage
    var count = 0
    for (var p in self.online) {
      var sockets = self.online[p]
      count += sockets.length
    }
    return count
  } else {
    return self.online[pathname].length
  }
}

LiveUpdater.prototype.sendUpdates = function (pathname) {
  var self = this
  var sockets = self.online[pathname]

  // Early return if there are no updates to send
  if (!sockets || sockets.length === 0) return

  var count = self.getOnlineCount(pathname)
  sockets.forEach(function (socket) {
    socket.send(JSON.stringify({ type: 'update', count: count }))
  })

  if (pathname !== '/') self.sendUpdates('/')
}


LiveUpdater.prototype.onSocketMessage = function (socket, str) {
  var self = this
  var message
  try {
    debug('Received message: ' + str)
    message = JSON.parse(str)
  } catch (e) {
    debug('Discarding non-JSON message: ' + message)
    return
  }
  if (message.type === 'online') {
    // Only accept the first 'online' message
    if (socket.pathname) return

    var pathname = socket.pathname = message.pathname

    if (!self.online[pathname]) self.online[pathname] = []
    self.online[pathname].push(socket)

    self.sendUpdates(pathname)
  }
}

LiveUpdater.prototype.onSocketClose = function (socket) {
  var self = this
  var sockets = self.online[socket.pathname]

  if (sockets) {
    var index = sockets.indexOf(socket)
    sockets.splice(index, 1)
    self.sendUpdates(socket.pathname)
  }
}

if (!module.parent) util.run(LiveUpdater)