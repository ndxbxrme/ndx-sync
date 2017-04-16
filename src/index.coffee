'use strict'

async = require 'async'

module.exports = (ndx) ->
  console.log 'sync', ndx.host
  serverSockets = []
  socket = null
  parentId = ''
  getServersToNotify = (type, args) ->
    output = []
    if not args.recipients
      args.recipients = ndx.id + ','
      if parentId
        args.recipients += parentId + ','
        socket.emit type, args
    for server in serverSockets
      if args.recipients.indexOf(server.serverId) is -1
        output.push server
        args.recipients += server.serverId + ','
    output
  if ndx.host
    ndx.socket.on 'connection', (socket) ->
      socket.on 'server', (data) ->
        console.log 'got server', data.id, ndx.id
        if data.id is ndx.id
          console.log 'dropping server'
          socket.disconnect()
        else
          socket.serverId = data.id
          socket.emit 'server', id: ndx.id
          serverSockets.push socket
      socket.on 'update', (args) ->
        ndx.database.serverExec 'update', args
      socket.on 'insert', (args) ->
        ndx.database.serverExec 'insert', args
      socket.on 'delete', (args) ->
        ndx.database.serverExec 'delete', args
    ndx.socket.on 'disconnect', (socket) ->
      if socket.serverId
        serverSockets.splice serverSockets.indexOf(socket), 1
    ndx.database.on 'update', (args, cb) ->
      servers = getServersToNotify 'update', args
      async.each servers, (server, callback) ->
        server.emit 'update', args
        callback()
      cb()
    ndx.database.on 'insert', (args, cb) ->
      servers = getServersToNotify 'insert', args
      async.each servers, (server, callback) ->
        server.emit 'insert', args
        callback()
      cb()
    ndx.database.on 'delete', (args, cb) ->
      servers = getServersToNotify 'delete', args
      async.each servers, (server, callback) ->
        server.emit 'delete', args
        callback()
      cb()
    io = require 'socket.io-client'
    socket = io.connect ndx.host, reconnect: true
    socket.on 'connect', ->
      console.log 'client connected'
      socket.emit 'server', id:ndx.id
      socket.on 'server', (args) ->
        console.log 'parent server', args.id
        parentId = args.id
      socket.on 'update', (args) ->
        ndx.database.serverExec 'update', args
      socket.on 'insert', (args) ->
        ndx.database.serverExec 'insert', args
      socket.on 'delete', (args) ->
        ndx.database.serverExec 'delete', args
    socket.on 'disconnect', ->
      console.log 'client disconnected'
      