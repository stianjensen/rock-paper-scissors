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
const spectators = {};
let scores = {};
let currentPlayers = [];

let history = [{moves: {}}];

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

    if (message.event === 'spectator') {
        message.data.id = userId;
        if (message.data){
            spectators[userId] = message.data;
        } else {
            spectators[userId] = 'Anonymous spectator';
        }
        sock.broadcast('spectators', spectators);
        conn.send('spectator', spectators[userId]);
        console.log('registered spectator: ' + spectators[userId]);
    }

    if (message.event === 'reconnect') {
      if (users[message.data.id] || spectators[message.data.id]) {
        userId = message.data.id;
        sock.broadcast('users', users);
        sock.broadcast('spectators', spectators);
        if (users[message.data.id]) {
            conn.send('user', users[userId]);
        } else {
            conn.send('spectator', spectators[userId]);
        }
        conn.send('scores' ,scores);
        conn.send('history', history.slice(0,-1));
      }
    }

    if (message.event === 'move') {
      const lastRound = history[history.length - 1];
      if (lastRound.moves[userId] == null) {
        lastRound.moves[userId] = message.data;
      }
      const pending = findPending(lastRound.moves, currentPlayers);
      sock.broadcast('pending', pending);
      console.log('pending: ' + pending);
      if (pending.length === 0) {
        const roundResults = game.computeRoundResults(lastRound.moves);
        lastRound.results = roundResults;
        history.push({moves: {}}); //The round is over, so we initiate a new empty round
        playForSingleResult(roundResults, playToWin);
        updateResults(roundResults);
      }
    }

    if (message.event === 'deleteUser') {
      delete users[message.data];
      const index = currentPlayers.indexOf(message.data);
      if (index !== -1) {
        currentPlayers.splice(index, 1);
      }
      sock.broadcast('users', users);
    }

    if (message.event === 'resetGame') {
    	resetGame();
    	sock.broadcast('scores', scores);
    	sock.broadcast('winner', null);
        sock.broadcast('history', history.slice(0,-1));
        sock.broadcast('startNewRound');
    }
  });
});

function resetGame() {
	for (const cid in users) {
		scores[cid] = 0;
	}
	history = [{moves: {}}];
}

function updateResults(roundResults){
	console.log("stalemate: " + roundResults.stalemate);
	console.log("winner: " + roundResults.winners);
	console.log("scores: " + scores);
    sock.broadcast('scores', scores);
	potentialWinner = checkForWinner(scores);
	if (potentialWinner) {
		sock.broadcast('winner', users[potentialWinner].name);
	}
	sock.broadcast('history', history.slice(0,-1));
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
	sock.targetedBroadcast(currentPlayers, 'startNewRound');
	sock.broadcast('pending', stayers.map(usid=>users[usid].name));
	sock.broadcast('newRoundStarted');
}

function findPending(moves, currentPlayers){
	const pending = [];
	for (const cid of currentPlayers) {
		if (!(cid in moves)){
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
