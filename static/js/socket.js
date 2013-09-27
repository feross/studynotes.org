var socket

function openSocket () {
  socket = eio('ws://' + window.location.host, {
    transports: ['polling']
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
// openSocket()
$('.online').hide()

function onMessage (str) {
  var message
  try {
    console.log('Received message: ' + str)
    message = JSON.parse(str)
  } catch (e) {
    console.log('Discarding non-JSON message: ' + message)
    return
  }
  if (message.type === 'update') {
    var count = message.count
    var studentsStr = (count === 1)
      ? 'student'
      : 'students'
    var pageStr = (window.location.pathname === '/')
      ? '(whole site)'
      : '(on this page)'
    $('.online').text(message.count + ' ' + studentsStr + ' online ' + pageStr)
  }
}

function onClose () {
  console.log('Lost socket to server, reconnecting in ' + config.socketReconnectTimeout)
  setTimeout(openSocket, config.socketReconnectTimeout)
}