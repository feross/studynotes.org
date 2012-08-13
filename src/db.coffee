mysql = require 'mysql'
config = require './config'

exports.connect = ->
  conn = mysql.createConnection config.mysql
  setupConnection conn
  
  conn


setupConnection = (conn) ->

  # Handle node shutdown even, close DB cleanly
  process.on 'SIGINT', ->
    console.log 'SHUTTING DOWN THE SERVER'
    conn.end (err) ->
      if err
        console.error 'Unable to close DB conn cleanly'
      process.exit(0)

  # Handle disconnects
  conn.on 'error', (err) ->
    if !err.fatal
      console.error err
      return

    if err.code != 'PROTOCOL_CONNECTION_LOST'
      throw err

    console.log 'Re-connecting lost connection: ', err.stack

    conn = mysql.createConnection connection.config
    setupConnection conn

  # Connect!
  conn.connect (err) ->
    throw err if err

  conn