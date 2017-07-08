const express = require('express');
const socket = require('./socket');

const app = express();
app.use(express.static('client/build'));

const users = {};

const history = [{}];

const sock = socket(conn => {
  users[conn.id] = {};

  sock.broadcast('users', users);

  conn.on('data', data => {
    const message = JSON.parse(data);

    if (message.event === 'register') {
      users[conn.id] = message.data;
      sock.broadcast('users', users);
    }

    if (message.event === 'move') {
      const lastRound = history[history.length - 1];
      if (lastRound[conn.id] != null) {
        lastRound.push({[conn.id]: message.data});
      } else {
        lastRound[conn.id] = message.data;
      }
      if (lastRound.length === users.length) {
        sock.broadcast('round', lastRound);
      }
    }
  });
});

const server = require('http').createServer(app);
sock.server.installHandlers(server, {prefix: '/socket'});


server.listen(7000);
console.log('Listening on port 7000');
