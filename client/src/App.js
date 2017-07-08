import React, { Component } from 'react';
import SockJS from 'sockjs-client';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    const socket = new SockJS('http://localhost:7000/socket');
    socket.onmessage = e => {
      const message = JSON.parse(e.data);
      console.log('message', message);

      if (message.event === 'round') {
        this.setState({
          currentMove: null,
          history: this.state.history.concat(message.data)
        });
      } else if (message.event === 'users') {
        this.setState({
          users: message.data
        });
      } else if (message.event === 'user') {
        window.localStorage.setItem('userId', message.data.id);
        this.setState({
          name: message.data.name,
        });
      } else if (message.event === 'scores') {
        this.setState({
          scores: message.data
        });
      }
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
                        { round[userId] }
                      </td>
                  ))}
                </tr>
            ))}
          </tbody>
        </table>
        { this.state.currentMove
          ? <div>Venter på resten</div>
          : <div>
              <button onClick={this.makeMove('rock')}>Rock</button>
              <button onClick={this.makeMove('paper')}>Paper</button>
              <button onClick={this.makeMove('scissor')}>Scissor</button>
            </div>
        }

        { this.state.name
          ? null
          : <div className='popover'>
              <div>
                <input onChange={this.changeName} />
                <button onClick={this.setName}>Join</button>
              </div>
            </div>
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
      </div>
    );
  }
}

export default App;
