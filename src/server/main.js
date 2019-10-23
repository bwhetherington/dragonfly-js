import Timer from './timer';
import GM from '../shared/event/GameManager';
import Server from '../shared/network/Server';
import delayServer from '../shared/network/DelayServer';
import WM from '../shared/entity/WorldManager';
import Hero from '../shared/entity/Hero';
import Vector from '../shared/util/Vector';
import { readFileSync } from 'fs';

const REFRESH_RATE = 60;

class GameServer extends Server {
  constructor(maxConnections) {
    super(maxConnections);
    this.heroes = {};
  }

  onOpen(socketIndex) {
    // Create hero for player
    const hero = new Hero(socketIndex);
    WM.add(hero);
    this.heroes[socketIndex] = hero;

    this.send({
      type: 'ASSIGN_ID',
      data: {
        playerID: socketIndex
      }
    }, socketIndex);

    this.send({
      type: 'DEFINE_ARENA',
      data: {
        geometry: WM.geometry.map(shape => ({ type: shape.constructor.name, ...shape }))
      }
    }, socketIndex);

    hero.registerHandler('MOUSE_DOWN', event => {
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
    })

  }

  onClose(socketIndex) {
    const hero = this.heroes[socketIndex];
    hero.markForDelete();
  }

  initialize() {
    super.initialize();
    GM.registerHandler('KEY_DOWN', event => {
      const hero = this.heroes[event.socketIndex];
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
        case 'KeyF':
          hero.applyForce(new Vector(100, 0));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          hero.setSlow(true);
          break;
      };
    });
    GM.registerHandler('KEY_UP', event => {
      const hero = this.heroes[event.socketIndex];
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
    });

    // Load level
    const levelString = readFileSync('level.json', 'utf-8');
    const levelGeometry = JSON.parse(levelString);

    WM.setGeomtetry(levelGeometry);
  }

  onMessage(message, socketIndex) {
    super.onMessage(message, socketIndex);
    // Attach socket index
    const event = {
      type: message.type,
      data: {
        ...message.data,
        socketIndex: socketIndex
      }
    };
    GM.emitEvent(event);
  }
}

const main = async () => {
  const server = new (delayServer(GameServer, -1))(4);
  server.initialize();

  WM.initialize();

  // Create level geometry

  // Create the game timer
  const timer = new Timer(1 / REFRESH_RATE, dt => {
    GM.step(dt);
    WM.sync(server);
  });

  timer.start();
};

main().catch(console.err);
