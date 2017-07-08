const express = require('express');
const socket = require('./socket');
const game = require('./game');

const app = express();
app.use(express.static('client/build'));

const users = {};
const scores = {};

const history = [{}];

const sock = socket(conn => {
  users[conn.id] = {name: 'Ukjent'};

  sock.broadcast('users', users);

  conn.on('data', data => {
    const message = JSON.parse(data);

    if (message.event === 'register') {
      users[conn.id] = message.data;
      scores[conn.id] = 0;
      sock.broadcast('users', users);
    }

    if (message.event === 'move') {
      const lastRound = history[history.length - 1];
      if (lastRound[conn.id] == null) {
        lastRound[conn.id] = message.data;
      }
      if (lastRound.length === users.length) {
        const roundResults = game.computeRoundResults(lastRound);
        updateResults(roundResults);
        history.push({});
        sock.broadcast('round', lastRound);
        sock.broadcast('scores', scores);
      }
    }

    if (message.event === 'deleteUser') {
      delete users[message.data];
      sock.broadcast('users', users);
    }
  });
});

function updateResults(roundResults){
	if (roundResults.stalemate) { //stalemate is a boolean that is true if no-one won the round
		return;
	}
	for (cid in roundResults.winners) {
		scores[cid] = scores[cid] + 1;
	}
}

const server = require('http').createServer(app);
sock.server.installHandlers(server, {prefix: '/socket'});


server.listen(7000);
console.log('Listening on port 7000');
