import GM from "../shared/event/GameManager";

class Scoreboard {
  constructor(tbodyID) {
    this.tbody = document.getElementById(tbodyID);
    this.players = {};
  }

  removePlayer(playerID) {
    const player = this.players[playerID];
    if (player) {
      const { element } = player
      element.parentNode.removeChild(element);
      delete this.players[playerID];
    }
  }

  initialize() {
    GM.registerHandler('REMOVE_PLAYER', event => {
      this.removePlayer(event.id);
    });

    GM.registerHandler('UPDATE_SCORE', event => {
      const { id, score } = event;
      const player = this.players[id];
      if (player) {
        player.score = score;
      }
    });

    GM.registerHandler('DISPLAY_PING', event => {
      const { latencies } = event;
      for (const id in latencies) {
        const player = this.players[id];
        if (player) {
          player.ping = latencies[id];
        }
      }
    });
  }

  addPlayer(playerID) {
    const row = document.createElement('tr');

    const playerName = document.createElement('td');
    playerName.innerText = playerID;

    const playerScore = document.createElement('td');
    playerScore.innerText = 0;

    const playerPing = document.createElement('td');
    playerPing.innerText = 0;

    row.append(playerName, playerScore, playerPing);

    const playerObject = {
      name: playerID,
      score: 0,
      ping: 0,
      element: row
    };

    this.players[playerID] = new Proxy(playerObject, {
      set(obj, prop, val) {
        obj[prop] = val;

        // Update UI
        switch (prop) {
          case 'name':
            playerName.innerText = val;
            break;
          case 'score':
            playerScore.innerText = val;
            break;
          case 'ping':
            const ping = Math.round(val * 1000) + 'ms';
            playerPing.innerText = ping;
            break;
        }

        return true;
      }
    });

    // Append row to table
    this.tbody.appendChild(row);
  }
}

export default Scoreboard;