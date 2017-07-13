import React, { Component } from 'react';
import SockJS from 'sockjs-client';
import rock from './rock.svg';
import scissors from './scissors.svg';
import paper from './paper.svg';
import './App.css';

function SummaryRow(props) {
  return (<tr className="header">
          <td className="move rowNumber"> # </td>
              { Object.keys(props.userList).map(userId => (
                  <td
                    key={userId}
                    className={`username ${userId === props.user ? 'yourself' : ''}`}
                    >
                    {props.userList[userId].name}
                    &nbsp;
                    ({props.scores[userId] || 0})
                  </td>
              ))}
            </tr>);
}

function ResultsTable(props) {
  const table = props.history.map((round, index) => (
                <tr key={index + props.startIndex}>
                <td className="move rowNumber"> {index + props.startIndex} </td>
                  { Object.keys(props.users).map(userId => (
                      <td
                        key={userId}
                        className={`move
                                    ${userId === props.userId ? 'yourself' : ''}
                                    ${round.moves[userId] === round.results.winningMove ? 'win' : ''}
                                    `}
                        >
                        { round.moves[userId] === 'rock' ? <img src={rock} alt="Rock" /> : null }
                        { round.moves[userId] === 'paper' ? <img src={paper} alt="Paper" /> : null }
                        { round.moves[userId] === 'scissor' ? <img src={scissors} alt="Scissors" /> : null }
                      </td>
                  ))}
                </tr>
            ));
  return (<tbody>{table}</tbody>);
}

function ShortenedResultsTable(props) {
  let history = props.history;
  const totalLength = props.history.length;
  let startIndex = 1;
  if (totalLength > props.displayLength){
    history = history.slice(totalLength - props.displayLength);
    startIndex = totalLength - props.displayLength + 1;
  }
  console.log(history);
  console.log(startIndex);
  return <ResultsTable history={history} startIndex={startIndex} userId={props.userId} users={props.users} />;
}

class App extends Component {
  constructor(props) {
    super(props);

    let socketURL = `http://${window.location.hostname}:7000/socket`;
    if (process.env.NODE_ENV === 'production') {
      socketURL = '/socket';
    }
    const socket = new SockJS(socketURL);
    socket.onmessage = e => {
      const message = JSON.parse(e.data);
      console.log('message', message);

      switch (message.event) {
        case 'startNewRound': {
          this.setState({
            currentMove: null
          });
          console.log('interaction: ' + this.state.interaction);
          break;
        }
        case 'newRoundStarted': {
          this.setState({
            waiting: null,
            pending: null,
          });
          break;
        }
        case 'users': {
          this.setState({
            users: message.data
          });
          break;
        }
        case 'user':  {
          window.localStorage.setItem('userId', message.data.id);
          this.setState({
            userId: message.data.id,
            name: message.data.name,
            interaction: 'player'
          });
          break;
        }
        case 'scores':  {
          this.setState({
            scores: message.data
          });
          break;
        }
        case 'winner':  {
          this.setState({
            winner: message.data
          });
          break;
        }
        case 'history': {
          this.setState({
            history: message.data
          });
          break;
        }
        case 'pending': {
          const waiting = Object.values(this.state.users)
            .map(user => user.name)
            .filter(userName => !message.data.includes(userName));
          this.setState({
            waiting,
            pending: message.data,
          })
          break;
        }
        case 'spectator': {
          window.localStorage.setItem('userId', message.data.id);
          this.setState({
            userId: message.data.id,
            name: message.data.name,
            interaction: 'spectator'
          });
          break;
        }
        case 'spectators': {
          this.setState({
            spectators: message.data
          })
          break;
        }
        default: {
          console.log('Unrecognized event received: ' + message.event);
          break;
        }
      };
    };

    this.state = {
      history: [
      ],
      users: {
      },
      scores: {},
      spectators: {},
      fullView: false,
    };

    const userId = window.localStorage.getItem('userId');
    if (userId) {
      socket.onopen = () => {
        socket.send(JSON.stringify({
          event: 'reconnect',
          data: {id: userId},
        }));
      }
    }

    this.makeMove = move => e => {
      socket.send(JSON.stringify({
        event: 'move',
        data: move,
      }));
      this.setState({currentMove: move});
    };

    this.changeName = e => {
      this.setState({editName: e.target.value});
    };

    this.toggleFullView = () => {
      this.setState({fullView: !this.state.fullView});
    };

    this.joinAsSpectator = () => {
      this.setName('spectator');
    };

    this.joinAsPlayer = () => {
      this.setName('register');
    }

    this.setName = (interactionType) => {
      this.setState({name: this.state.editName});
      socket.send(JSON.stringify({
        event: interactionType,
        data: {name: this.state.editName},
      }));
    };

    this.deleteUser = userId => e => {
      socket.send(JSON.stringify({
        event: 'deleteUser',
        data: userId,
      }));
    };

    this.resetGame = () => {
      socket.send(JSON.stringify({
        event: 'resetGame'
      }));
    };

    this.showSettings = () => {
      this.setState({settingsVisible: true});
    };

    this.hideSettings = () => {
      this.setState({settingsVisible: false});
    };
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <button
            style={{float: 'right'}}
            onClick={this.showSettings}>
            Settings
          </button>
          <h2>Rock - Paper - Scissors</h2>
          <p><em>Which one is it? It's your decision</em></p>
        </div>
        <table className="history">
          <thead>
            <SummaryRow userList={this.state.users} user={this.state.userId} scores={this.state.scores} />
          </thead>
          { this.state.fullView
            ? <ResultsTable history={this.state.history} startIndex={1} users={this.state.users} userId={this.state.userId} />
            : <ShortenedResultsTable history={this.state.history} users={this.state.users} userId={this.state.userId} displayLength={4} />
          }
          <tfoot>
            <SummaryRow userList={this.state.users} user={this.state.userId} scores={this.state.scores} />
          </tfoot>
        </table>
        <button id="toggleFullView" onClick={this.toggleFullView}> See {this.state.fullView ? 'shortened' : 'full'} history </button>
        { this.state.currentMove || this.state.interaction === 'spectator'
          ? <div>Venter på { this.state.pending ? this.state.pending.join(', ') : 'neste runde' }</div>
          : <div>
              <p>{ this.state.waiting && this.state.waiting.length ? `${this.state.waiting.join(', ')} har spilt` : null }</p>
              <a
                className='move-action'
                onClick={this.makeMove('rock')}
                >
                <img src={rock} alt="Rock" />
                Rock
              </a>
              <a 
                className='move-action'
                onClick={this.makeMove('paper')}
                >
                <img src={paper} alt="Paper" />
                Paper
              </a>
              <a
                className='move-action'
                onClick={this.makeMove('scissor')}
                >
                <img src={scissors} alt="Scissors" />
                Scissor
              </a>
            </div>
        }

        { this.state.name
          ? null
          : <div className='popover'>
              <div>
                <form onSubmit={this.joinAsPlayer}>
                  <p>
                    <strong>Type your name: </strong>
                    <input onChange={this.changeName} />
                  </p>
                  <p>
                    <input type='submit' value='Join the game' name='join_button' />
                    <input type='button' onClick={this.joinAsSpectator} value='Just watch' name='watch_button' />
                  </p>
                </form>
              </div>
            </div>
        }
        { this.state.winner
          ? <div className='popover'>
              <div>
                <h2>Vinner</h2>
                <h2>{this.state.winner}</h2>
                <button onClick={this.resetGame}>Start a new game</button>
              </div>
            </div>
          : null
        }
        { this.state.settingsVisible
          ? <div className='popover'>
              <div>
                <button
                  style={{float: 'right'}}
                  onClick={this.hideSettings}>
                  Close
                </button>
                <h2>Fjern brukere</h2>
                { Object.keys(this.state.users).map(userId => (
                  <div key={userId}>
                    <button onClick={this.deleteUser(userId)}>
                      Slett {this.state.users[userId].name}
                    </button>
                  </div>
                ))}
                <br/>
                { Object.keys(this.state.spectators).length > 0
                  ? (<div id="spectator_list">
                  <p> <strong> Tilskuere </strong></p>
                    { Object.keys(this.state.spectators).map(userId => (
                      <div key={userId} className="spectator_div">
                        {this.state.spectators[userId].name}
                      </div>
                    )) }
                    </div>)
                  : null
                }
                <br/>
                { this.state.interaction === 'player'
                  ? <button onClick={this.resetGame}>Restart the whole game</button>
                  : null
                }
                <div><small><em>
                  Icons created by Cristiano Zoucas from the Noun Project
                </em></small></div>
              </div>
            </div>
          : null
        }
      </div>
    );
  }
}

export default App;
