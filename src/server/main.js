import Timer from "./timer";
import GM from "../shared/event/GameManager";
import Server from "../shared/network/Server";
import delayServer from "../shared/network/DelayServer";
import WM from "../shared/entity/WorldManager";
import Hero from "../shared/entity/Hero";
import { readFileSync } from "fs";
import Rectangle from "../shared/util/Rectangle";
import WeaponPickUp from "../shared/entity/WeaponPickUp";
import NM from "../shared/network/NetworkManager";
import {
  diff,
  deepDiff,
  pruneEmpty,
  randomInt,
  setServer
} from "../shared/util/util";
import LM from "../shared/network/LogManager";
import SETTINGS from "../shared/util/settings";
import Enemy from "../shared/entity/Enemy";
import Entity from "../shared/entity/Entity";
import { iterator } from "lazy-iters";

const REQUIRED_PLAYERS = 1;
const REFRESH_RATE = 60;
const LAG_OPTIONS = [0, 0.075, 0.15, 0.3];

const CONFIG_OPTIONS = [
  {
    opponentPredictionEnabled: true,
    predictionEnabled: true,
    timeWarpEnabled: true
  }
];

// const CONFIG_OPTIONS = [
//   {
//     opponentPredictionEnabled: false,
//     predictionEnabled: false,
//     timeWarpEnabled: false
//   },
//   {
//     opponentPredictionEnabled: true,
//     predictionEnabled: true,
//     timeWarpEnabled: false
//   },
//   {
//     opponentPredictionEnabled: false,
//     predictionEnabled: false,
//     timeWarpEnabled: true
//   },
//   {
//     opponentPredictionEnabled: true,
//     predictionEnabled: true,
//     timeWarpEnabled: true
//   }
// ];

const ROUND_TIME = 60;
const TIME_WARNINGS = [30, 45, 50, 55, 56, 57, 58, 59];

// const ROUND_TIME = 10;
// const TIME_WARNINGS = [5, 6, 7, 8, 9];

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
    this.latencyLevelIndex = 0;
  }

  *getHeroes() {
    for (const heroID in this.heroes) {
      yield this.heroes[heroID];
    }
  }

  endGame() {
    const winner = iterator(this.getHeroes()).fold(null, (prev, cur) => {
      if (prev === null || cur.score > prev.score) {
        return cur;
      } else {
        return prev;
      }
    });

    if (winner) {
      const wonEvent = {
        type: "GAME_WON",
        data: {
          winningHeroID: winner.id
        }
      };
      NM.send(wonEvent);
    }
    this.resetGame();
  }

  createTimer() {
    const timerEntity = new Entity();
    timerEntity.isCollidable = false;
    // Arbitrary position to be way away from everything else
    timerEntity.setPositionXY(-10000, -100000);

    WM.add(timerEntity);

    // timerEntity.runDelay(ROUND_TIME, () => {
    //   // End game
    //   this.endGame();
    // });

    // for (const warning of TIME_WARNINGS) {
    //   timerEntity.runDelay(warning, () => {
    //     const remaining = Math.round(ROUND_TIME - warning);
    //     const message = `${remaining} second(s) remaining.`;
    //     NM.log(message);
    //   });
    // }
  }

  onClose(socketIndex) {
    const hero = this.heroes[socketIndex];

    if (hero) {
      hero.dropWeapon();
      hero.markForDelete();

      const message = {
        type: "REMOVE_PLAYER",
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

  setConfig(config) {
    for (const option in config) {
      SETTINGS[option] = config[option];
    }
    const event = {
      type: "CHANGE_SETTINGS",
      data: {
        settings: config
      }
    };
    NM.send(event);
  }

  addHeroes() {
    const heroesAdded = [];
    for (let index in this.heroesToCreate) {
      index = parseInt(index);
      if (this.heroes[index] === undefined) {
        this.createHero(index);
        heroesAdded.push(this.heroes[index]);
      }
    }

    // Pick unlagged player
    const latencyIndex = this.latencyLevelIndex % LAG_OPTIONS.length;
    const configIndex =
      (this.latencyLevelIndex / LAG_OPTIONS.length) % CONFIG_OPTIONS.length;

    this.setConfig(CONFIG_OPTIONS[configIndex]);

    LM.logData({
      type: "START_GAME",
      data: {
        settings: CONFIG_OPTIONS[configIndex],
        latency: LAG_OPTIONS[latencyIndex]
      }
    });

    const unlagged = randomInt(0, heroesAdded.length);
    for (let i = 0; i < heroesAdded.length; i++) {
      if (i !== unlagged) {
        const latency = LAG_OPTIONS[latencyIndex];
        this.setDelay(i, latency / 2);
        const newState = {
          type: "ASSIGN_LATENCY",
          data: {
            socketIndex: i,
            latency
          }
        };
        GM.emitEvent(newState);
      }
    }
    this.latencyLevelIndex += 1;

    this.createTimer();
  }

  scheduleHeroToCreate(socketIndex, name) {
    this.heroesToCreate[socketIndex] = name;
  }

  createHero(socketIndex) {
    const hero = new Hero(socketIndex);
    hero.name = this.heroesToCreate[socketIndex] || "Hero";
    this.heroes[socketIndex] = hero;
    WM.add(hero);

    // Get spawn point
    const spawnPoint = WM.getSpawnPoint(socketIndex);
    hero.setPosition(spawnPoint);

    // Assign player ID to player
    NM.send(
      {
        type: "ASSIGN_ID",
        data: {
          playerID: socketIndex,
          entityID: hero.id,
          serverTime: GM.timeElapsed
        }
      },
      socketIndex
    );

    hero.registerHandler("MOUSE_DOWN", data => {
      const event = {
        type: "TIME_WARPED_MOUSE_DOWN",
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

    hero.registerHandler("MOUSE_UP", event => {
      const { position, socketIndex } = event;
      if (hero.playerID === socketIndex) {
        hero.setTarget(position);
        if (hero.weapon) {
          hero.weapon.stop();
        }
      }
    });

    hero.registerHandler("TIME_WARPED_MOUSE_DOWN", event => {
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

    hero.registerHandler("ROTATE_CANNON", event => {
      const { playerID, angle, target, socketIndex } = event;
      if (playerID === socketIndex && hero.playerID === playerID) {
        hero.rotateCannon(angle);
        hero.setTarget(target);
      }
    });

    hero.registerHandler("PLAYER_KILLED", event => {
      const { killerID, killedID } = event;
      if (hero.id === killerID && hero.id !== killedID) {
        hero.score += hero.maxDamage;
      }
    });
  }

  isFull() {
    return Object.keys(this.heroesToCreate).length >= REQUIRED_PLAYERS;
  }

  initialize() {
    super.initialize();

    // Assign random latency
    // GM.registerHandler('JOIN_GAME', event => {
    //   const { socketIndex } = event;
    //   // const latency = Math.random() * SETTINGS.maxLatency / 2;
    //   const latency = 0.2;
    //   this.setDelay(socketIndex, latency);
    //   const newState = {
    //     type: 'ASSIGN_LATENCY',
    //     data: {
    //       socketIndex,
    //       latency
    //     }
    //   };
    //   GM.emitEvent(newState);
    // });

    GM.registerHandler("ASSIGN_LATENCY", event => {
      const { socketIndex, latency } = event;
      console.log(`Player ${socketIndex}: ${latency}`);
    });

    GM.registerHandler("JOIN_GAME", event => {
      const { name, socketIndex } = event;

      // Create hero for player
      this.scheduleHeroToCreate(socketIndex, name);

      if (this.isFull()) {
        this.addHeroes();
      }
    });

    GM.registerHandler("REJOIN_GAME", event => {
      console.log("REJOIN_GAME", event);

      const { socketIndex } = event;
      const name = this.lastGameHeroes[socketIndex];
      const rejoin = {
        type: "JOIN_GAME",
        data: {
          name,
          socketIndex
        }
      };
      GM.emitEvent(rejoin);
    });

    GM.registerHandler("KEY_DOWN", event => {
      const hero = this.heroes[event.socketIndex];
      if (hero) {
        switch (event.key) {
          case "KeyW":
            hero.setInput("up", true);
            break;
          case "KeyS":
            hero.setInput("down", true);
            break;
          case "KeyA":
            hero.setInput("left", true);
            break;
          case "KeyD":
            hero.setInput("right", true);
            break;
          case "KeyQ":
            hero.dropWeapon();
            break;
        }
      }
    });

    GM.registerHandler("KEY_UP", event => {
      const hero = this.heroes[event.socketIndex];
      if (hero) {
        switch (event.key) {
          case "KeyW":
            hero.setInput("up", false);
            break;
          case "KeyS":
            hero.setInput("down", false);
            break;
          case "KeyA":
            hero.setInput("left", false);
            break;
          case "KeyD":
            hero.setInput("right", false);
            break;
        }
      }
    });

    GM.registerHandler("PLAY_AUDIO", data => {
      const event = {
        type: "PLAY_AUDIO",
        data
      };

      NM.send(event);
    });

    GM.registerHandler("CHAT_INPUT", data => {
      console.log(data);
      const event = {
        type: "CHAT_OUTPUT",
        data
      };
      NM.send(event);
      const { id, author, content } = data.message;
      console.log(`[${id}] ${author}: ${content}`);
    });

    GM.registerHandler("SPAWN_ENEMY", event => {
      const enemy = new Enemy();
      enemy.setPosition(WM.getRandomPoint(40, 40));
      WM.add(enemy);
    });

    GM.registerHandler("KILL_AI", event => {
      iterator(WM.getEntities())
        .filter(entity => entity.type === "Enemy")
        .forEach(entity => entity.markForDelete());
    });

    GM.registerHandler("ROLLBACK", event => {
      const successful = WM.rollbackFrom(GM.timeElapsed - event.amount);
      if (successful) {
        NM.log("Rollback completed.");
      } else {
        NM.log("Rollback not completed.");
      }
    });

    GM.registerHandler("REQUEST_STATS", event => {
      const { socketIndex } = event;
      const entityCount = WM.getEntityCount();
      const listenerCount = GM.getHandlerCount();
      NM.send(
        {
          type: "SEND_STATS",
          data: {
            entityCount,
            listenerCount
          }
        },
        socketIndex
      );
    });

    // GM.registerHandler("PLAYER_KILLED", event => {
    //   let winningHeroID = -1;
    //   for (const key in this.heroes) {
    //     const hero = this.heroes[key];
    //     if (hero.lives > 0) {
    //       if (winningHeroID !== -1) {
    //         return;
    //       } else {
    //         winningHeroID = hero.id;
    //       }
    //     }
    //   }

    //   const wonEvent = {
    //     type: "GAME_WON",
    //     data: {
    //       winningHeroID
    //     }
    //   };
    //   NM.send(wonEvent);
    //   this.resetGame();
    // });

    // Load level
    const levelString = readFileSync("level.json", "utf-8");
    const level = JSON.parse(levelString);

    WM.setSpawnPoints(level.spawnPoints);
    WM.setGeomtetry(level.geometry);
    if (level.friction !== undefined) {
      WM.friction = level.friction;
    }
    if (level.features !== undefined) {
      WM.icePatches = level.features.map(
        ({ x, y, width, height }) => new Rectangle(x, y, width, height)
      );
    }

    this.generatePickups();
  }

  generatePickups() {
    const raygun = new WeaponPickUp("Raygun");
    raygun.setPosition(WM.getRandomPoint(30, 30));
    WM.add(raygun);

    const rocket = new WeaponPickUp("Rocket");
    rocket.setPosition(WM.getRandomPoint(30, 30));
    WM.add(rocket);

    const shotgun = new WeaponPickUp("Shotgun");
    shotgun.setPosition(WM.getRandomPoint(30, 30));
    WM.add(shotgun);

    const madsen = new WeaponPickUp("Madsen");
    madsen.setPosition(WM.getRandomPoint(30, 30));
    WM.add(madsen);

    const mortar = new WeaponPickUp("Mortar");
    mortar.setPosition(WM.getRandomPoint(30, 30));
    WM.add(mortar);
  }

  resetGame() {
    console.log("reset game");
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
      type: "RESET_GAME",
      data: {}
    };
    GM.emitEvent(message);
    NM.send(message);
  }

  onOpen(socketIndex) {
    super.onOpen(socketIndex);
    NM.send(
      {
        type: "DEFINE_ARENA",
        data: {
          friction: WM.friction,
          ice: WM.icePatches.map(shape => ({
            type: shape.type,
            ...shape
          })),
          geometry: WM.geometry.map(shape => ({
            type: shape.type,
            ...shape
          }))
        }
      },
      socketIndex
    );
  }
}

const initializeCleanup = (server, timer) => {
  process.on("exit", cleanup.bind(null, server, timer, { clean: true }));
  process.on("SIGINT", cleanup.bind(null, server, timer, { exit: true }));
  process.on("SIGUSR1", cleanup.bind(null, server, timer, { exit: true }));
  process.on("SIGUSR2", cleanup.bind(null, server, timer, { exit: true }));
  process.on(
    "uncaughtException",
    cleanup.bind(null, server, timer, { exit: true })
  );
};

const cleanup = (server, timer, options) => {
  if (options.clean) {
    console.log("Cleaning server resources");
    server.stop();
    timer.stop();
    LM.closeAllStreams();
  }
  if (options.exit) {
    process.exit();
  }
};

const main = async () => {
  setServer();
  const server = new (delayServer(GameServer))(8);
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
  // process.on('exit', cleanup(server, timer));
  initializeCleanup(server, timer);

  server.start();
  timer.start();
};

main().catch(console.error);
