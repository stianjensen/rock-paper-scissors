const beatRules = {
		'rock' : 'paper',
		'paper' : 'scissors',
		'scissors' : 'rock'
	};

function computeRoundResults(round) { //Returns the set of connections that won
	let playedMoves = {'rock' : 0, 'paper' : 0, 'scissors' : 0}; //will keep track of whether each move has been played in the round
	let winners = [];
	let losers = [];
	let firstMovers = []; //We don't know where to place the first mover until someone plays a different move from them
	let firstMove = null;
	let winningMove = null;
	let losingMove = null;
	let leaderMove = null;
	let stalemate = true; //we start out with a stalemate until someone plays a move that beats someone
	for (const conn in round) { 
		const move = round[conn];
		const isBeaten = (playedMoves[beatRules[move]] > 0) //Look up the move that beats the current move and check that if it has been played
		const beatsSomeone = (playedMoves[beatRules[beatRules[move]]] > 0) // Look up the move that loses to you and check if it has been played
		playedMoves[move] = playedMoves[move] + 1; //Register that the move has been played by increasing the count in the playedMoves registry

		if (!isBeaten && !beatsSomeone) { //If you neither win nor lose you are either first or playing the same as the first player
			firstMovers.push(conn.id);
			firstMove = move;
		}
		if (!isBeaten && beatsSomeone) { //You are a winner if you beat someone without being beaten
			winners.push(conn.id);
			for (const cid in firstMovers) { //since we beat someone without losing, the n first players must have lost to us - we push them to losers
				losers.push(cid);
			}
			losingMove = firstMove;
			firstMovers = []; //Since the first movers are now beaten, we move them and empty the list
			stalemate = false;
			winningMove = move;
		}
		if (isBeaten && !beatsSomeone) { //You are a loser if you lose to someone without beating anyone else
			losers.push(conn.id);
			for (const cid in firstMovers){ //Since we lost to someone without winning, the first n players must have beat us - we push them to winners
				winners.push(cid);
			}
			firstMovers = []; // since the first movers are now allocated as winners, we empty the list
			winningMove = firstMove;
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
	}
	return { stalemate, winners, losers, winningMove, losingMove };
}

module.exports = { computeRoundResults };