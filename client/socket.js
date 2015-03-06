var $ = require('jquery')
var config = require('../config')
var Socket = require('simple-websocket')
var util = require('../util')

var socket
var lastTotalHits
var stats

function openSocket () {
  socket = new Socket(config.wsEndpoint)
  socket.on('ready', function () {
    socket.send(JSON.stringify({
      type: 'online',
      url: window.location.pathname
    }))
  })
  socket.on('message', onMessage)
}

if (typeof global.WebSocket === 'function' && !$('html').hasClass('isMobile')) {
  openSocket()
}

function onMessage (message) {
  // console.log('Received message: ' + message)
  if (message.type === 'update') {
    if (message.count) {
      // Set a phrase with live visitor count
      var studentsStr = (message.count === 1) ? 'student' : 'students'
      $('.online')
        .text(message.count + ' ' + studentsStr + ' online now (this page)')
        .show()

      // Set just the visitor count number, no other words
      $('.onlineNum span').text(util.addCommas(message.count))
      $('.onlineNum').show()
    }

    // Set the total hits number, no other words
    if (message.totalHits) {
      if (lastTotalHits !== message.totalHits) {
        $('.totalHits').text(util.addCommas(message.totalHits)).removeClass('pulse animated small')

        setTimeout(function () {
          $('.totalHits').addClass('pulse animated')
        }, 10)
      }
      lastTotalHits = message.totalHits
    }
  } else if (message.type === 'stats') {
    stats = message.stats
    renderStats()
  } else if (message.type === 'statsUpdate') {
    if (!stats)
      return
    if (message.count === 0)
      delete stats[message.url]
    else
      stats[message.url] = message
    renderStats()
  }
}

function renderStats () {
  $('.loading').hide()
  $('.stats').show()

  var urlsByCount = Object.keys(stats).sort(function (a, b) {
    if (stats[a].count < stats[b].count) return 1
    if (stats[a].count > stats[b].count) return -1
    return 0
  })
  var rows = []
  urlsByCount.forEach(function (url) {
    var data = stats[url]
    rows.push(data)
  })

  $('.stats tbody')
    .render(rows, {
      title: {
        href: function () {
          return this.url
        }
      }
    })
    .removeClass('off')
}
