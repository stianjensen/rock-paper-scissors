const express = require('express');
const socket = require('./socket');
const game = require('./game');

const app = express();
app.use(express.static('client/build'));

//config

const gameMode = 'playForSingleResult';
const playToWin = true;

//end config

const users = {};
let scores = {};
let currentPlayers = [];

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
      currentPlayers.push(userId);
    }

    if (message.event === 'reconnect') {
      if (users[message.data.id]) {
        userId = message.data.id;
        sock.broadcast('users', users);
        conn.send('user', users[userId]);
        conn.send('scores' ,scores);
        conn.send('history', history);
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
        sock.broadcast('startNewRound', history);
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
	console.log("scores: " + scores);
    sock.broadcast('scores', scores);
    sock.broadcast('roundResults', roundResults);
	potentialWinner = checkForWinner(scores);
	if (potentialWinner) {
		sock.broadcast('winner', users[potentialWinner].name);
	}
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
	console.log("stayers: " + stayers);
	const waiters = [];
	if (stayers.length === 1){
		scores[stayers[0]] = scores[stayers[0]] + 1;
		currentPlayers = [];
		for (const usid in users){
			currentPlayers.push(usid);
		}
	} else {
		currentPlayers = stayers;
	}
	sock.targetedBroadcast(currentPlayers, 'startNewRound')
	sock.broadcast('history', history)
}

function findPending(round, currentPlayers){
	const pending = [];
	for (const cid of currentPlayers) {
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
