var socket

function openSocket () {
  socket = eio(config.engineEndpoint, {
    transports: ['polling', 'websocket']
  })
  socket.onopen = function () {
    socket.onmessage = onMessage
    socket.onclose = onClose

    socket.send(JSON.stringify({
      type: 'online',
      pathname: window.location.pathname
    }))
  }
}
openSocket()

function onMessage (str) {
  var message
  try {
    // console.log('Received message: ' + str)
    message = JSON.parse(str)
  } catch (e) {
    // console.log('Discarding non-JSON message: ' + message)
    return
  }
  if (message.type === 'update') {

    // Set a phrase with live visitor count
    var studentsStr = (message.count === 1) ? 'student' : 'students'
    $('.online')
      .text(message.count + ' ' + studentsStr + ' online now (this page)')
      .show()

    // Set just the visitor count number, no other words
    $('.onlineNum span').text(util.addCommas(message.count))
    $('.onlineNum').show()

    // Set the total hits number, no other words
    if (message.totalHits) {
      $('.totalHits').text(util.addCommas(message.totalHits))
    }
  }
}

function onClose () {
  // console.log('Lost socket to server, reconnecting in ' + config.socketReconnectTimeout)
  setTimeout(openSocket, config.socketReconnectTimeout)
}