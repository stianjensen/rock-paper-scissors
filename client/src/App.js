import React, { Component } from 'react';
import SockJS from 'sockjs-client';
import rock from './rock.svg';
import scissors from './scissors.svg';
import paper from './paper.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    const socket = new SockJS('http://localhost:7000/socket');
    socket.onmessage = e => {
      const message = JSON.parse(e.data);
      console.log('message', message);

      switch (message.event) {
        case 'startNewRound': {
          this.setState({
            currentMove: null
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
            name: message.data.name,
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
          this.setState({
            pending: message.data
          })
        }
      };
    };

    this.state = {
      history: [
      ],
      users: {
      },
      scores: {},
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

    this.setName = () => {
      this.setState({name: this.state.editName});
      socket.send(JSON.stringify({
        event: 'register',
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

    }
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Rock - paper - scissors</h2>
        </div>
        <table>
          <thead>
            <tr className="header">
              { Object.keys(this.state.users).map(userId => (
                  <td key={userId} className="username">
                    {this.state.users[userId].name}
                    &nbsp;
                    ({this.state.scores[userId] || 0})
                  </td>
              ))}
            </tr>
          </thead>
          <tbody>
            { this.state.history.map((round, index) => (
                <tr key={index}>
                  { Object.keys(this.state.users).map(userId => (
                      <td key={userId} className="move">
                        { round[userId] === 'rock' ? <img src={rock} /> : null }
                        { round[userId] === 'paper' ? <img src={paper} /> : null }
                        { round[userId] === 'scissor' ? <img src={scissors} /> : null }
                      </td>
                  ))}
                </tr>
            ))}
          </tbody>
        </table>
        { this.state.currentMove
          ? <div>Venter på { this.state.pending ? this.state.pending.join(', ') : 'neste runde' }</div>
          : <div>
              <a
                className='move-action'
                onClick={this.makeMove('rock')}
                >
                <img src={rock} />
                Rock
              </a>
              <a 
                className='move-action'
                onClick={this.makeMove('paper')}
                >
                <img src={paper} />
                Paper
              </a>
              <a
                className='move-action'
                onClick={this.makeMove('scissor')}
                >
                <img src={scissors} />
                Scissor
              </a>
            </div>
        }

        { this.state.name
          ? null
          : <div className='popover'>
              <div>
                <form onSubmit={this.setName}>
                  <input onChange={this.changeName} />
                  <input type='submit' value='Join' />
                </form>
              </div>
            </div>
        }
        { this.state.winner
          ? <div className='popover'>
              <div>
                <h2>Vinner</h2>
                <h2>{this.state.winner}</h2>
                <button onClick={this.resetGame}> Reset game </button>
              </div>
            </div>
          : null
        }
        <div>
          <h2>Fjern brukere</h2>
          { Object.keys(this.state.users).map(userId => (
            <div key={userId}>
              <button
                onClick={this.deleteUser(userId)}
                className="username">
              Slett {this.state.users[userId].name}
              </button>
            </div>
          ))}
        </div>
        <button onClick={this.resetGame}> Reset game </button>
        <div><small><em>
          Icons created by Cristiano Zoucas from the Noun Project
        </em></small></div>
      </div>
    );
  }
}

export default App;
