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
          history: this.state.history.concat(message.data)
        });
      } else if (message.event === 'users') {
        this.setState({
          users: message.data
        });
      }
    };

    this.state = {
      history: [
      ],
      users: {
      },
    };

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
              { Object.values(this.state.users).map(user => (
                  <td key={user.name} className="username">
                    {user.name}
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
          ? null
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
      </div>
    );
  }
}

export default App;
