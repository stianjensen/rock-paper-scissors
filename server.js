const express = require('express');
const socket = require('./socket');
const game = require('./game');

const app = express();
app.use(express.static('client/build'));

const users = {};
let scores = {};

let history = [{}];

const sock = socket(conn => {
  let userId = conn.id;

  conn.on('data', data => {
    const message = JSON.parse(data);

    if (message.event === 'register') {
      message.data.id = userId;
      users[userId] = message.data;
      scores[userId] = 0;
      sock.broadcast('users', users);
      conn.send('user', message.data);
    }

    if (message.event === 'reconnect') {
      if (users[message.data.id]) {
        userId = message.data.id;
        sock.broadcast('users', users);
        conn.send('user', users[userId]);
      }
    }

    if (message.event === 'move') {
      const lastRound = history[history.length - 1];
      if (lastRound[userId] == null) {
        lastRound[userId] = message.data;
      }
      const pending = findPending(lastRound, users);
      sock.broadcast('pending', pending);
      if (pending.length === 0) {
        const roundResults = game.computeRoundResults(lastRound);
        updateResults(roundResults);
        history.push({});
        sock.broadcast('startNewRound', lastRound);
        sock.broadcast('scores', scores);
      }
    }

    if (message.event === 'deleteUser') {
      delete users[message.data];
      sock.broadcast('users', users);
    }

    if (message.event === 'resetGame') {
    	resetGame();
    	sock.broadcast('scores', scores);
    	sock.broadcast('winner', null);
    	sock.broadcast('history', history);
    }
  });
});

function resetGame() {
	for (const cid in users) {
		scores[cid] = 0;
	}
	history = [{}];
}

function updateResults(roundResults){
	console.log("stalemate: " + roundResults.stalemate);
	console.log("winner: " + roundResults.winners);
	pointsForAllWinners(roundResults) //Replace this line to change game mode
	potentialWinner = checkForWinner(scores);
	if (potentialWinner) {
		sock.broadcast('winner', users[potentialWinner].name);
	}
	console.log(scores);
}

function pointsForAllWinners(roundResults) {
	if (roundResults.stalemate) { //stalemate is a boolean that is true if no-one won the round
		return;
	}
	for (cid of roundResults.winners) {
		scores[cid] = scores[cid] + 1;
	}
}

function playForSingleResult(roundResults, playToWin){
	const stayers = game.getStayers(roundResults, playToWin);
	const waiters = [];
	if (stayers.length === 1){
		scores[stayers[0]] = scores[stayers[0]] + 1;
		currentPlayers = users;
	} else {
		for (const cid of users) {
			if (!stayers.includes(cid)){
				waiters.add(cid);
			}
		}
		currentPlayers = stayers;
	}
	sock.targetedBroadcast(currentPlayers, 'tieBreakRound', null) //TODO put in right place
	sock.targetedBroadcast(waiters, 'waitRound', null) //TODO
}

function findPending(round, users){
	const pending = [];
	for (const cid in users) {
		if (!(cid in round)){
			pending.push(cid);
		}
	}
	return pending.map(usid => users[usid].name);
}

function checkForWinner(scores){
	let highest = 0;
	let nextHighest = 0;
	let winner = null;
	for (const cid in scores){
		if (scores[cid] > highest) {
			winner = cid;
			nextHighest = highest;
			highest = scores[cid];
		}
		else if (scores[cid] > nextHighest) {
			nextHighest = scores[cid];
		}
	}
	if (highest - nextHighest >= 3) {
		return winner;
	}
	else {
		return false;
	}
}

const server = require('http').createServer(app);
sock.server.installHandlers(server, {prefix: '/socket'});


server.listen(7000);
console.log('Listening on port 7000');
