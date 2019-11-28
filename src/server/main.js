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
import { diff, deepDiff, pruneEmpty } from '../shared/util/util';

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
      this.heroes[socketIndex] = name;
      if (Object.keys(this.heroes).length > 0) {
        for (const curKey in this.heroes) {
          const curSocketIndex = parseInt(curKey);
          const curHero = new Hero(curSocketIndex);
          const curName = this.heroes[curKey];
          curHero.name = curName;
          this.heroes[curSocketIndex] = curHero;
          GM.addEntity(curHero);

          NM.send({
            type: 'ASSIGN_ID',
            data: {
              playerID: curSocketIndex,
              serverTime: GM.timeElapsed
            }
          }, curSocketIndex);

          curHero.registerHandler('MOUSE_DOWN', data => {
            const event = {
              type: 'TIME_WARPED_MOUSE_DOWN',
              data
            };
            // console.log('rollback', GM.timeElapsed - data.timeElapsed);
            // GM.emitEvent(event);


            const { socketIndex } = data;
            if (curHero.playerID === socketIndex) {
              const { weapon } = curHero;
              if (weapon.useTimeWarp) {
                // If we use time warp, roll back and insert the event
                WM.rollbackFrom(data.timeElapsed, event);
              } else {
                // Otherwise just process it right now
                GM.emitEventFirst(event);
              }
            }
          });

          curHero.registerHandler('TIME_WARPED_MOUSE_DOWN', event => {
            // console.log(event);
            const { position, socketIndex } = event;
            if (curHero.playerID === socketIndex) {
              const { x, y } = position;
              curHero.fireXY(x, y);
            }
          });

          curHero.registerHandler('ROTATE_CANNON', event => {
            const { playerID, angle, socketIndex } = event;
            if (playerID === socketIndex && curHero.playerID === playerID) {
              curHero.rotateCannon(angle);
            }
          });

          curHero.registerHandler('PLAYER_KILLED', event => {
            const { killerID } = event;
            if (curHero.id === killerID) {
              curHero.score += curHero.maxDamage;
            }
          });
        }
      }
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
      // const state = WM.getStateAtTime(GM.timeElapsed - 1);
      // WM.revertState(state);

      // for (const object of WM.getEntities()) {
      //   if (object.hasOwnProperty('input')) {
      //     console.log(object.input);
      //   }
      // }

      const before = WM.serializeAll();
      // const beforeEvents = GM.storedEvents.toArray();
      WM.rollbackFrom(GM.timeElapsed - 0.5);
      const after = WM.serializeAll();
      // const afterEvents = GM.storedEvents.toArray();
      const diff = deepDiff(before, after);
      // NM.messageClients('diff', diff);
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
    // this.generatePickups();
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
