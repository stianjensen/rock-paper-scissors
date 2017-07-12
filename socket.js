const sock = require('sockjs');

function socket(onConnectionCallback) {
  const server = sock.createServer();

  const connections = {};

  function broadcast(event, data) {
    for (const id in connections) {
      connections[id].send(event, data);
    }
  };

  function targetedBroadcast(connIds, event, data) {
    console.log("send to connections: " + connIds);
    for (const id of connIds) {
      if (!(id in connections)) {
        continue;
      }
      console.log("sending to: " + id);
      console.log("from list: " + JSON.stringify(connIds));
      connections[id].send(event, data);
    }
  };

  server.on('connection', conn => {
    connections[conn.id] = conn;
    console.log('A client has connected: ');

    conn.send = function(event, data) {
      conn.write(JSON.stringify({
        event,
        data,
      }));
    };

    if (onConnectionCallback) {
      onConnectionCallback(conn);
    }

    conn.on('close', () => {
      delete connections[conn.id];
      console.log('A client has disconnected');
    });

  });

  return {server, broadcast, targetedBroadcast};
}

module.exports = socket;
