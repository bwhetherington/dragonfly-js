import Client from '../shared/network/Client';
import Entity from '../shared/entity/Entity';
import WM from '../shared/entity/WorldManager';
import Hero from '../shared/entity/Hero';
import GM from '../shared/event/GameManager';
import Projectile from '../shared/entity/Projectile';
import Explosion from '../shared/entity/Explosion';
import Laser from '../shared/entity/Laser';
import Vector from '../shared/util/Vector';
import AM from '../shared/audio/AudioManager';
import WeaponPickUp from '../shared/entity/WeaponPickUp';
import SETTINGS from '../shared/util/settings';
import Bar from './Bar';
import Scoreboard from './Scoreboard';
import CM from './ChatManager';
import SizedQueue from '../shared/util/SizedQueue';
import HealthPickUp from '../shared/entity/HealthPickUp';
import NM from '../shared/network/NetworkManager';
import LM from '../shared/network/LogManager';

const defaultColor = 'rgba(0, 0, 0, 0.67)';

const rgba = (r, g, b, a) => 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';

const rgb = (r, g, b) => rgba(r, g, b, 1);

const average = list => {
  let sum = 0;
  for (let i = 0; i < list.length; i++) {
    sum += list[i];
  }
  return sum / list.length;
};

const removeChildren = element => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

const gatherFormData = formElements => {
  let formResults = {};
  for (let i = 0, element; element = formElements[i++];) {
    if (element.checked) {
      if (element.name in formResults) {
        formResults[element.name].push(element.value);
      } else {
        formResults[element.name] = [element.value];
      }
      element.checked = false;
    }
  }
  return formResults;
}

class GameClient extends Client {
  constructor(two, addr) {
    super(two, addr);
    this.playerID = -2;
    this.heroID = null;
    this.latencies = {};
    this.entityMenu = document.getElementById('entity-menu');
    this.entities = document.getElementById('entity-tbody');
    this.hpBar = new Bar('bar-value', 'bar-label', 30);
  }

  createEntityRow(entity) {
    const row = document.createElement('tr');
    const type = document.createElement('td');
    const position = document.createElement('td');
    const id = document.createElement('td');

    type.innerText = entity.type;
    position.innerText = `(${Math.round(entity.position.x)}, ${Math.round(entity.position.y)})`;
    id.innerText = entity.id;

    row.append(type, position, id);
    this.entities.appendChild(row);
  }

  initializeUI() {
    let lastFPS = 60;
    const fpsQueue = new SizedQueue(10);

    // Create scoreboard
    this.scoreboard = new Scoreboard('scoreboard-tbody');
    this.scoreboard.initialize();

    const weaponLabel = document.getElementById('weapon-label');

    GM.registerHandler('EQUIP_WEAPON', event => {
      const { type } = event;
      weaponLabel.innerText = type;
    });

    GM.registerHandler('DROP_WEAPON', () => {
      weaponLabel.innerText = 'Pistol';
    });

    let totalEntities = 0;
    let avgChange = 0;

    const entityLabel = document.getElementById('entity-count');
    const listenerLabel = document.getElementById('listener-count');
    const fpsLabel = document.getElementById('fps');
    const debugMenu = document.getElementById('debug-menu');
    let canChangeToRed = true;

    GM.registerHandler('STEP', event => {
      // Update entities
      if (!this.entityMenu.hidden) {
        removeChildren(this.entities);
        for (const entity of WM.getEntities()) {
          this.createEntityRow(entity);
        }
      }

      const { hero } = this;

      if (hero) {
        this.hpBar.value = hero.maxDamage - hero.damageAmount;
      }

      const curFPS = 1 / event.dt;
      fpsQueue.enqueue(curFPS);
      // Smooth fps slightly
      const fps = Math.round(average(fpsQueue.toArray()));


      debugMenu.style.backgroundColor = rgba(150, 0, 0, 0.67);

      const entityCount = WM.entityCount;
      const listenerCount = GM.handlerCount;

      entityLabel.innerText = entityCount;
      listenerLabel.innerText = listenerCount;
      fpsLabel.innerText = fps;

      if (SETTINGS.colorDebugMenu && entityCount > 150) {
        debugMenu.style.backgroundColor = rgba(150, 0, 0, 0.67);
        canChangeToRed = false;
      } else {
        debugMenu.style.backgroundColor = rgba(0, 0, 0, 0.67);
        canChangeToRed = true;
      }
    });
  }

  registerInput() {
    // Register handlers to send to server
    GM.registerHandler('KEY_DOWN', event => {
      // Process locally
      const { hero } = this;
      if (hero) {
        switch (event.key) {
          case 'KeyW':
            hero.setInput('up', true);
            break;
          case 'KeyS':
            hero.setInput('down', true);
            break;
          case 'KeyA':
            hero.setInput('left', true);
            break;
          case 'KeyD':
            hero.setInput('right', true);
            break;
          case 'KeyP':
            SETTINGS.predictionEnabled = !SETTINGS.predictionEnabled;
            break;
          case 'KeyE':
            this.entityMenu.hidden = !this.entityMenu.hidden;
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            hero.setSlow(true);
            break;
        };
      }

      NM.send({
        type: 'KEY_DOWN',
        data: event
      });
    });

    GM.registerHandler('KEY_UP', event => {
      const { hero } = this;
      if (hero) {
        switch (event.key) {
          case 'KeyW':
            hero.setInput('up', false);
            break;
          case 'KeyS':
            hero.setInput('down', false);
            break;
          case 'KeyA':
            hero.setInput('left', false);
            break;
          case 'KeyD':
            hero.setInput('right', false);
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            hero.setSlow(false);
            break;
        };
      }

      NM.send({
        type: 'KEY_UP',
        data: event
      });
    });

    GM.registerHandler('MOUSE_DOWN', event => {
      NM.send({
        type: 'MOUSE_DOWN',
        data: event
      });
    });

    GM.registerHandler('MOUSE_UP', event => {
      NM.send({
        type: 'MOUSE_UP',
        data: event
      });
    });
  }

  attachCamera(entity) {
    GM.registerHandler('STEP', () => {
      const centerX = (this.two.width / 2 - entity.position.x);
      const centerY = (this.two.height / 2 - entity.position.y);
      this.two.scene.translation.set(centerX, centerY);
    });
  }

  initializeHealthBar() {
    const bar = document.getElementById('bar-value');
    bar.style = { ...bar.style, width: "100%" };
  }

  initializeGameResult(winningHeroID) {
    const { hero } = this;
    const modal = document.getElementById('game-end-page');
    const modalText = document.getElementById('game-end-text');
    const form = document.getElementById('rejoin-game');
    const game = document.getElementById('game');
    if (hero.id === winningHeroID) {
      modalText.innerHTML = "Congratulations, You Won!"
    } else {
      modalText.innerHTML = "Game Over, You lost"
    }
    modal.hidden = false;
    form.onsubmit = event => {
      let formElements = document.getElementById('rejoin-game').elements;
      let formResults = gatherFormData(formElements);
      event.preventDefault();

      const message = {
        type: 'REJOIN_GAME',
        data: {
          heroID: hero.id
        }
      };
      const formMessage = {
        type: 'LOG_DATA',
        data: formResults
      };
      NM.send(message);
      NM.send(formMessage);
      modal.hidden = true;
      if (game) {
        game.focus();
      }
    };
  }

  initializeGameEnded() {
    const modal = document.getElementById('game-ended-page');
    modal.hidden = false;
  }

  initializeHero(hero) {
    this.hero = hero;
    CM.hero = hero;
    this.hpBar.maxValue = hero.maxDamage;
    GM.hero = hero;
    this.attachCamera(hero);
    hero.registerHandler('MOUSE_MOVE', event => {
      const { x, y } = event.position;

      const dx = x - hero.position.x;
      const dy = y - hero.position.y;

      const angle = Math.atan2(dy, dx) + Math.PI / 2;
      if (hero.cannon) {
        hero.rotateCannon(angle);
        const newEvent = {
          type: 'ROTATE_CANNON',
          data: {
            playerID: hero.playerID,
            angle: angle,
            target: event.position
          }
        };
        GM.emitEvent(newEvent);
      }
    });
  }

  initialize(window) {
    super.initialize(window);

    this.registerInput();
    this.initializeUI();

    GM.registerHandler('CLEANUP_GRAPHICS', event => {
      const { object } = event;
      this.two.remove(object);
    });

    GM.registerHandler('CREATE_OBJECT', event => {
      const { object } = event;
      if (object.type === 'Hero') {
        if (object.playerID === this.playerID) {
          this.initializeHero(object);
        }

        // Add to scoreboard
        this.scoreboard.addPlayer(object);
      }
    })

    GM.registerHandler('CREATE_RAY', event => {
      const { start, end, source } = event;
      const sourceEntity = source ? WM.findByID(source) : null;
      const sourceHero = sourceEntity instanceof Hero ? sourceEntity : null;
      const sourcePosition = sourceHero ? sourceHero.getCannonTip(35) : new Vector(start.x, start.y);
      const p0 = sourcePosition;
      const p1 = new Vector(end.x, end.y);
      const laser = new Laser(p0, p1);
      WM.add(laser);

      const explosion = new Explosion({ red: 200, green: 0, blue: 0 }, 10);
      explosion.setPosition(p1);
      WM.add(explosion);
    });

    GM.registerHandler('ROTATE_CANNON', event => {
      const packet = {
        type: 'ROTATE_CANNON',
        data: event
      };
      NM.send(packet);
    });

    GM.registerHandler('PLAY_AUDIO', data => {
      const position = GM.hero ? GM.hero.position : null;
      AM.playSoundInternal(data.filename, data.volume, data.position, position);
    });

    GM.registerHandler('GAME_WON', event => {
      this.initializeGameResult(event.winningHeroID);
    });

    GM.registerHandler('ASSIGN_ID', (event, remove) => {
      CM.playerID = event.playerID;
      this.playerID = event.playerID;
      this.heroID = event.entityID;
      GM.timeElapsed = event.serverTime;
      remove();
    });
  }
}

export default GameClient;