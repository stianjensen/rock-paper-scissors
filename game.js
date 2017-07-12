const beatRules = {
		'rock' : 'paper',
		'paper' : 'scissor',
		'scissor' : 'rock'
	};

function computeRoundResults(round) { //Returns the set of connections that won
	let playedMoves = {'rock' : 0, 'paper' : 0, 'scissor' : 0}; //will keep track of whether each move has been played in the round
	let winners = [];
	let losers = [];
	let players = [];
	let firstMovers = []; //We don't know where to place the first mover until someone plays a different move from them
	let firstMove = null;
	let winningMove = null;
	let losingMove = null;
	let leaderMove = null;
	let stalemate = true; //we start out with a stalemate until someone plays a move that beats someone
	console.log(round);
	for (const connid in round) {
		console.log("entering " + connid);
		players.push(connid);
		const move = round[connid];
		console.log(move);
		const isBeaten = (playedMoves[beatRules[move]] > 0) //Look up the move that beats the current move and check that if it has been played
		console.log("isBeaten: " + isBeaten);
		const beatsSomeone = (playedMoves[beatRules[beatRules[move]]] > 0) // Look up the move that loses to you and check if it has been played
		console.log("beatsSomeone: " + beatsSomeone);
		playedMoves[move] = playedMoves[move] + 1; //Register that the move has been played by increasing the count in the playedMoves registry

		if (!isBeaten && !beatsSomeone) { //If you neither win nor lose you are either first or playing the same as the first player
			firstMovers.push(connid);
			firstMove = move;
		}
		if (!isBeaten && beatsSomeone) { //You are a winner if you beat someone without being beaten
			winners.push(connid);
			if (firstMovers.length > 0) { //Check if there are any first movers with unresolved results
				for (const cid of firstMovers) { //since we beat someone without losing, the n first players must have lost to us - we push them to losers
					losers.push(cid);
				}
				losingMove = firstMove;
				firstMovers = []; //Since the first movers are now beaten, we move them and empty the list
			}
			stalemate = false;
			winningMove = move;
		}
		if (isBeaten && !beatsSomeone) { //You are a loser if you lose to someone without beating anyone else
			losers.push(connid);
			if (firstMovers.length > 0) { //Check if there are any first movers with unresolved results
				for (const cid of firstMovers){ //Since we lost to someone without winning, the first n players must have beat us - we push them to winners
					winners.push(cid);
				}
				firstMovers = []; // since the first movers are now allocated as winners, we empty the list
				winningMove = firstMove;
			}
			stalemate = false;
			losingMove = move;
		}
		if (isBeaten && beatsSomeone) { //If you both beat someone and lose, it is a stalemate, and it means all different moves are played
			stalemate = true;
			winners = [];
			losers = [];
			losingMove = null;
			winningMove = null;
		}
		console.log("stalemate: " + stalemate);
	}
	return { stalemate, winners, losers, winningMove, losingMove, players };
}

function getStayers(roundResults, playToWin){
	if (roundResults.stalemate) {
		return roundResults.players;
	}
	if (playToWin) {
		return roundResults.winners;
	} else {
		return roundResults.losers;
	}
}

module.exports = { computeRoundResults, getStayers };