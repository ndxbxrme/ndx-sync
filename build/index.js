(function() {
  'use strict';
  var async;

  async = require('async');

  module.exports = function(ndx) {
    var getServersToNotify, io, parentId, serverSockets, socket;
    console.log('sync', ndx.host);
    serverSockets = [];
    socket = null;
    parentId = '';
    getServersToNotify = function(type, args) {
      var i, len, output, server;
      output = [];
      if (!args.recipients) {
        args.recipients = ndx.id + ',';
        if (parentId) {
          args.recipients += parentId + ',';
          socket.emit(type, args);
        }
      }
      for (i = 0, len = serverSockets.length; i < len; i++) {
        server = serverSockets[i];
        if (args.recipients.indexOf(server.serverId) === -1) {
          output.push(server);
          args.recipients += server.serverId + ',';
        }
      }
      return output;
    };
    if (ndx.host) {
      ndx.socket.on('connection', function(socket) {
        socket.on('server', function(data) {
          console.log('got server', data.id, ndx.id);
          if (data.id === ndx.id) {
            console.log('dropping server');
            return socket.disconnect();
          } else {
            socket.serverId = data.id;
            socket.emit('server', {
              id: ndx.id
            });
            return serverSockets.push(socket);
          }
        });
        socket.on('update', function(args) {
          return ndx.database.serverExec('update', args);
        });
        socket.on('insert', function(args) {
          return ndx.database.serverExec('insert', args);
        });
        return socket.on('delete', function(args) {
          return ndx.database.serverExec('delete', args);
        });
      });
      ndx.socket.on('disconnect', function(socket) {
        if (socket.serverId) {
          return serverSockets.splice(serverSockets.indexOf(socket), 1);
        }
      });
      ndx.database.on('update', function(args) {
        var servers;
        servers = getServersToNotify('update', args);
        return async.each(servers, function(server, callback) {
          server.emit('update', args);
          return callback();
        });
      });
      ndx.database.on('insert', function(args) {
        var servers;
        servers = getServersToNotify('insert', args);
        return async.each(servers, function(server, callback) {
          server.emit('insert', args);
          return callback();
        });
      });
      ndx.database.on('delete', function(args) {
        var servers;
        servers = getServersToNotify('delete', args);
        return async.each(servers, function(server, callback) {
          server.emit('delete', args);
          return callback();
        });
      });
      io = require('socket.io-client');
      socket = io.connect(ndx.host, {
        reconnect: true
      });
      socket.on('connect', function() {
        console.log('client connected');
        socket.emit('server', {
          id: ndx.id
        });
        socket.on('server', function(args) {
          console.log('parent server', args.id);
          return parentId = args.id;
        });
        socket.on('update', function(args) {
          return ndx.database.serverExec('update', args);
        });
        socket.on('insert', function(args) {
          return ndx.database.serverExec('insert', args);
        });
        return socket.on('delete', function(args) {
          return ndx.database.serverExec('delete', args);
        });
      });
      return socket.on('disconnect', function() {
        return console.log('client disconnected');
      });
    }
  };

}).call(this);

//# sourceMappingURL=index.js.map
