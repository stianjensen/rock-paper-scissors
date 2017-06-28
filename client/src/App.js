import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      history: [
        {1: 'paper', 2: 'rock'},
      ],
      users: {
        1: {name: 'Stian'},
        2: {name: 'Bjarne'},
        3: {name: 'Ola'},
      },
    };

    this.makeMove = move => e => {
      this.setState({currentMove: move});
    };
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Rock - paper - scissors</h2>
        </div>
        <table>
          <tr className="header">
            { Object.values(this.state.users).map(user => (
                <td key={user.name} className="username">
                  {user.name}
                </td>
            ))}
          </tr>
          { this.state.history.map((round, index) => (
              <tr key={index}>
                { Object.keys(this.state.users).map(userId => (
                    <td key={userId} className="move">
                      { round[userId] }
                    </td>
                ))}
              </tr>
          ))}
          { this.state.currentMove
            ? null
            : <div>
                <button onClick={this.makeMove('rock')}>Rock</button>
                <button onClick={this.makeMove('paper')}>Paper</button>
                <button onClick={this.makeMove('scissor')}>Scissor</button>
              </div>
          }
        </table>
      </div>
    );
  }
}

export default App;
