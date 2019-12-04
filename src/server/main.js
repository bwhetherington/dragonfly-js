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
import LM from '../shared/network/LogManager';

const REFRESH_RATE = 60;

class GameServer extends Server {
  constructor(maxConnections) {
    super(maxConnections);
    this.heroes = {};
    this.lastGameHeroes = {};
    this.heroesToCreate = {};
    this.messages = [];
    this.numberOfHeroes = 0;
    this.minPlayers = 2;
    this.spawnPoints = [];
  }

  onClose(socketIndex) {
    const hero = this.heroes[socketIndex];

    if (hero) {
      hero.dropWeapon();
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

    delete this.heroes[socketIndex];
    delete this.heroesToCreate[socketIndex];

    super.onClose(socketIndex);
  }

  addHeroes() {
    for (let index in this.heroesToCreate) {
      index = parseInt(index);
      if (this.heroes[index] === undefined) {
        this.createHero(index);
      }
    }
  }

  scheduleHeroToCreate(socketIndex, name) {
    this.heroesToCreate[socketIndex] = name;
  }

  getSpawnPoint(index) {
    const len = this.spawnPoints.length;
    console.log('getSpawnPoint', index, this.spawnPoints);
    if (len > 0) {
      return this.spawnPoints[index % len] || { x: 0, y: 0 };
    } else {
      return {
        x: 0,
        y: 0
      };
    }
  }

  createHero(socketIndex) {
    const hero = new Hero(socketIndex);
    hero.name = this.heroesToCreate[socketIndex] || 'Hero';
    this.heroes[socketIndex] = hero;
    WM.add(hero);

    // Get spawn point
    const spawnPoint = this.getSpawnPoint(socketIndex);
    hero.setPosition(spawnPoint);

    // Assign player ID to player
    NM.send({
      type: 'ASSIGN_ID',
      data: {
        playerID: socketIndex,
        entityID: hero.id,
        serverTime: GM.timeElapsed
      }
    }, socketIndex);

    hero.registerHandler('MOUSE_DOWN', data => {

      const event = {
        type: 'TIME_WARPED_MOUSE_DOWN',
        data
      };

      const { socketIndex } = data;
      if (hero.playerID === socketIndex) {
        const { weapon } = hero;
        if (weapon.useTimeWarp) {
          // If we use time warp, roll back and insert the event
          WM.rollbackFrom(data.timeElapsed, event);
        } else {
          // Otherwise just process it right now
          GM.emitEventFirst(event);
        }
      }
    });

    hero.registerHandler('MOUSE_UP', event => {
      const { position, socketIndex } = event;
      if (hero.playerID === socketIndex) {
        hero.setTarget(position);
        if (hero.weapon) {
          hero.weapon.stop();
        }
      }
    });

    hero.registerHandler('TIME_WARPED_MOUSE_DOWN', event => {
      const { position, socketIndex } = event;
      if (hero.playerID === socketIndex) {
        const { x, y } = position;
        hero.fireXY(x, y);
        hero.setTarget(position);
        if (hero.weapon) {
          hero.weapon.start();
        }
      }
    });

    hero.registerHandler('ROTATE_CANNON', event => {
      const { playerID, angle, target, socketIndex } = event;
      if (playerID === socketIndex && hero.playerID === playerID) {
        hero.rotateCannon(angle);
        hero.setTarget(target);
      }
    });

    hero.registerHandler('PLAYER_KILLED', event => {
      const { killerID } = event;
      if (hero.id === killerID) {
        hero.score += hero.maxDamage;
      }
    });
  }

  isFull() {
    return Object.keys(this.heroesToCreate).length >= 1;
  }

  initialize() {
    super.initialize();

    GM.registerHandler('JOIN_GAME', event => {
      const { name, socketIndex } = event;

      // Create hero for player
      this.scheduleHeroToCreate(socketIndex, name);

      if (this.isFull()) {
        this.addHeroes();
      }
    });

    GM.registerHandler('REJOIN_GAME', event => {
      console.log('REJOIN_GAME', event);

      const { socketIndex } = event;
      const name = this.lastGameHeroes[socketIndex];
      const rejoin = {
        type: 'JOIN_GAME',
        data: {
          name,
          socketIndex
        }
      };
      GM.emitEvent(rejoin);
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
      NM.send({
        type: 'SEND_STATS',
        data: {
          entityCount,
          listenerCount
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
      // const oldState = WM.serializeAll();
      WM.rollbackFrom(GM.timeElapsed - 0.5);
      // const newState = WM.serializeAll();
      // const diff = deepDiff(oldState, newState);
      // NM.logCode('diff', diff);
    });

    // Load level
    const levelString = readFileSync('level.json', 'utf-8');
    const level = JSON.parse(levelString);

    this.spawnPoints = level.spawnPoints;

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
    // let healthCount = 0;
    // GM.runTimer(1, () => {
    //   if (healthCount < 5) {
    //     healthCount += 1;
    //     const healthPickUp = new HealthPickUp();
    //     healthPickUp.setPosition(WM.getRandomPoint());
    //     WM.add(healthPickUp);
    //   }
    // });

    // GM.registerHandler('MARK_FOR_DELETE', event => {
    //   const entity = WM.findByID(event.id);
    //   if (entity && entity.type === 'HealthPickUp') {
    //     healthCount -= 1;
    //   }
    // });

    const raygun = new WeaponPickUp('Raygun');
    raygun.setPosition(WM.getRandomPoint());
    WM.add(raygun);

    const rocket = new WeaponPickUp('Rocket');
    rocket.setPosition(WM.getRandomPoint());
    WM.add(rocket);

    const shotgun = new WeaponPickUp('Shotgun');
    shotgun.setPosition(WM.getRandomPoint());
    WM.add(shotgun);

    const madsen = new WeaponPickUp('Madsen');
    madsen.setPosition(WM.getRandomPoint());
    WM.add(madsen);
  }

  resetGame() {
    console.log('reset game');
    this.numberOfHeroes = 0;

    // Delete all heroes
    for (const id in this.heroes) {
      delete this.heroes[id];
    }

    WM.deleteAllEntities();

    // Save player names
    for (const id in this.heroesToCreate) {
      this.lastGameHeroes[id] = this.heroesToCreate[id];
      delete this.heroesToCreate[id];
    }

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
  LM.closeAllStreams();
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
