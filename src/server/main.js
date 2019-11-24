import Timer from './timer';
import GM from '../shared/event/GameManager';
import Server from '../shared/network/Server';
import delayServer from '../shared/network/DelayServer';
import WM from '../shared/entity/WorldManager';
import Hero from '../shared/entity/Hero';
import { readFileSync } from 'fs';
import Rectangle from '../shared/util/Rectangle';
import WeaponPickUp from '../shared/entity/WeaponPickUp';
import HealthPickUp from '../shared/entity/HealthPickUp';
import NM from '../shared/network/NetworkManager';
import { diff, deepDiff } from '../shared/util/util';

const REFRESH_RATE = 60;

class GameServer extends Server {
  constructor(maxConnections) {
    super(maxConnections);
    this.heroes = {};
    this.messages = [];
  }

  onClose(socketIndex) {
    const hero = this.heroes[socketIndex];

    if (hero) {
      hero.markForDelete();

      const message = {
        type: 'REMOVE_PLAYER',
        data: {
          id: socketIndex
        }
      };

      for (const socket in this.connections) {
        if (socket !== socketIndex) {
          NM.send(message, socket);
        }
      }
    }

    super.onClose(socketIndex);
  }

  initialize() {
    super.initialize();

    GM.registerHandler('JOIN_GAME', event => {
      const { name, socketIndex } = event;

      // Create hero for player
      const hero = new Hero(socketIndex);
      hero.name = name;
      GM.addEntity(hero);
      this.heroes[socketIndex] = hero;

      NM.send({
        type: 'ASSIGN_ID',
        data: {
          playerID: socketIndex,
          serverTime: GM.timeElapsed
        }
      }, socketIndex);

      hero.registerHandler('MOUSE_DOWN', data => {
        const event = {
          type: 'TIME_WARPED_MOUSE_DOWN',
          data
        };
        console.log('rollback', GM.timeElapsed - data.timeElapsed);
        WM.rollbackFrom(data.timeElapsed, event);
      });

      hero.registerHandler('TIME_WARPED_MOUSE_DOWN', event => {
        console.log(event);
        const { position, socketIndex } = event;
        if (hero.playerID === socketIndex) {
          const { x, y } = position;
          hero.fireXY(x, y);
        }
      });

      hero.registerHandler('ROTATE_CANNON', event => {
        const { playerID, angle, socketIndex } = event;
        if (playerID === socketIndex && hero.playerID === playerID) {
          hero.rotateCannon(angle);
        }
      });

      hero.registerHandler('PLAYER_KILLED', event => {
        const { killerID } = event;
        if (hero.id === killerID) {
          hero.score += hero.maxDamage;
        }
      });
    });

    GM.registerHandler('REJOIN_GAME', event => {
      const { heroID } = event;

      const message = {
        type: 'REJOIN_GAME',
        data: {
          heroID
        }
      };
      NM.send(message);
    });


    GM.registerHandler('KEY_DOWN', event => {
      const hero = this.heroes[event.socketIndex];
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
          case 'KeyQ':
            hero.dropWeapon();
            break;
        };
      }
    });

    GM.registerHandler('KEY_UP', event => {
      const hero = this.heroes[event.socketIndex];
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
    });

    GM.registerHandler('PLAY_AUDIO', data => {
      const event = {
        type: 'PLAY_AUDIO',
        data
      };

      NM.send(event);
    });

    GM.registerHandler('CHAT_INPUT', data => {
      // this.messages.push(data.message);
      const event = {
        type: 'CHAT_OUTPUT',
        data
      };
      NM.send(event);
      const { id, author, content } = data.message;
      console.log(`[${id}] ${author}: ${content}`);
    });

    GM.registerHandler('REQUEST_STATS', event => {
      const { socketIndex } = event;
      const entityCount = WM.getEntityCount();
      const listenerCount = GM.getHandlerCount();
      console.log(GM.createdEntities);
      NM.send({
        type: 'SEND_STATS',
        data: {
          entityCount,
          listenerCount,
          entryCount: Object.entries(GM.createdEntities).length
        }
      }, socketIndex);
    });

    GM.registerHandler('PLAYER_KILLED', event => {
      let winningHeroID = -1;
      for (const key in this.heroes) {
        const hero = this.heroes[key];
        if (hero.lives > 0) {
          if (winningHeroID !== -1) {
            return;
          } else {
            winningHeroID = hero.id;
          }
        }
      }

      const wonEvent = {
        type: 'GAME_WON',
        data: {
          winningHeroID
        }
      };
      NM.send(wonEvent);
      this.resetGame();
    });

    GM.registerHandler('ROLLBACK', event => {
      // const state = WM.getStateAtTime(GM.timeElapsed - 2);
      // WM.revertState(state);
      // const before = WM.serializeAll();
      WM.rollbackFrom(event.timeElapsed - 1);
      // const after = WM.serializeAll();
      // console.log('rollback');
      // console.log(deepDiff(before, after));
    });

    // Load level
    const levelString = readFileSync('level.json', 'utf-8');
    const level = JSON.parse(levelString);

    WM.setGeomtetry(level.geometry);
    if (level.friction !== undefined) {
      WM.friction = level.friction;
    }
    if (level.features !== undefined) {
      WM.icePatches = level.features.map(({ x, y, width, height }) => new Rectangle(x, y, width, height));
    }

    this.generatePickups();
  }

  generatePickups() {
    let healthCount = 0;
    GM.runTimer(1, () => {
      if (healthCount < 5) {
        healthCount += 1;
        const healthPickUp = new HealthPickUp();
        healthPickUp.setPosition(WM.getRandomPoint());
        GM.addEntity(healthPickUp);
      }
    });

    GM.registerHandler('MARK_FOR_DELETE', event => {
      const entity = WM.findByID(event.id);
      if (entity && entity.type === 'HealthPickUp') {
        healthCount -= 1;
      }
    });

    const raygun = new WeaponPickUp('Raygun');
    raygun.setPosition(WM.getRandomPoint());
    GM.addEntity(raygun);

    const rocket = new WeaponPickUp('Rocket');
    rocket.setPosition(WM.getRandomPoint());
    GM.addEntity(rocket);

    const shotgun = new WeaponPickUp('Shotgun');
    shotgun.setPosition(WM.getRandomPoint());
    GM.addEntity(shotgun);
  }

  resetGame() {
    WM.deleteAllNonHero();
    this.generatePickups();
    const message = {
      type: 'RESET_GAME',
      data: {}
    };
    GM.emitEvent(message);
    NM.send(message);
  }

  onOpen(socketIndex) {
    super.onOpen(socketIndex);
    NM.send({
      type: 'DEFINE_ARENA',
      data: {
        friction: WM.friction,
        ice: WM.icePatches.map(shape => ({ type: shape.constructor.name, ...shape })),
        geometry: WM.geometry.map(shape => ({ type: shape.constructor.name, ...shape }))
      }
    }, socketIndex);
  }
}

const cleanup = (server, timer) => () => {
  server.stop();
  timer.stop();
};

const main = async () => {
  const server = new (delayServer(GameServer, 0))(8);
  server.initialize();

  WM.initialize();

  // Create level geometry

  // Create the game timer
  const PING_INTERVAL = 1;
  let timeElapsed = 0;
  const timer = new Timer(1 / REFRESH_RATE, dt => {
    timeElapsed += dt;
    GM.step(dt);
    WM.sync(server);
    if (timeElapsed >= PING_INTERVAL) {
      server.checkPings();
      timeElapsed -= PING_INTERVAL;
    }
  });

  // Create handler for SIGINT
  process.on('SIGINT', cleanup(server, timer));

  server.start();
  timer.start();
};

main().catch(console.error);
