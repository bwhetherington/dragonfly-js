import GM from "../shared/event/GameManager";
import WM from '../shared/entity/WorldManager';
import Hero from "../shared/entity/Hero";

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
    GM.registerHandler('RESET_GAME', event => {
      for (const id in this.players) {
        this.removePlayer(id);
      }
    });

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
      const { id, ping } = event;
      const player = this.players[id];
      if (player) {
        player.ping = ping;
      }
    });

    GM.registerHandler('PLAYER_KILLED', event => {
      const { deadID } = event;
      const hero = WM.findByID(deadID);
      if (hero instanceof Hero) {
        const playerID = hero.playerID;
        const player = this.players[playerID];
        if (player) {
          player.lives = hero.lives;
        }
      }
    });

    GM.registerHandler('RESPAWN', event => {
      const { id } = event;
      const hero = WM.findByID(id);
      if (hero instanceof Hero) {
        const playerID = hero.playerID;
        const player = this.players[playerID];
        if (player) {
          player.lives = hero.lives;
        }
      }
    });
  }

  resetPlayer(player) {
    const { playerID } = player;
    if (playerID !== undefined) {
      const playerRow = this.players[playerID];
      if (playerRow !== undefined) {
        playerRow.score = player.score;
        playerRow.lives = player.lives;
      }
    }
  }

  addPlayer(hero) {
    const { name, playerID } = hero;
    if (this.players[playerID] === undefined) {

      const row = document.createElement('tr');

      const playerName = document.createElement('td');
      playerName.innerText = name;

      const playerScore = document.createElement('td');
      playerScore.innerText = 0;

      const playerLives = document.createElement('td');
      playerLives.innerText = hero.lives;

      const playerPing = document.createElement('td');
      playerPing.innerText = 0;

      row.append(playerName, playerScore, playerLives, playerPing);

      const playerObject = {
        name,
        score: 0,
        ping: 0,
        element: row
      };

      this.players[playerID] = new Proxy(playerObject, {
        set(obj, prop, val) {
          if (obj[prop] !== val) {
            // Update UI
            switch (prop) {
              case 'name':
                playerName.innerText = val;
                break;
              case 'score':
                playerScore.innerText = val;
                break;
              case 'lives':
                playerLives.innerText = val;
                break;
              case 'ping':
                const ping = Math.round(val * 1000) + 'ms';
                playerPing.innerText = ping;
                break;
            }
          }
          return obj[prop] = val;
        }
      });

      // Append row to table
      this.tbody.appendChild(row);
    }
  }
}

export default Scoreboard;