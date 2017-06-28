const sock = require('sockjs');

function socket(onConnectionCallback) {
  const server = sock.createServer();

  const connections = {};

  function broadcast(event, data) {
    for (const id in connections) {
      connections[id].send(event, data);
    }
  }

  server.on('connection', conn => {
    connections[conn.id] = conn;
    console.log('A client has connected');

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

  return {server, broadcast};
}

module.exports = socket;