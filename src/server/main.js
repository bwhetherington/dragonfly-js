import Timer from './timer';
import GM from '../shared/event/GameManager';
import Server from '../shared/network/Server';
import Entity from '../shared/entity/Entity';
import WM from '../shared/entity/WorldManager';
import Hero from '../shared/entity/Hero';

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
      data: WM.bounds
    }, socketIndex);
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
        case 'w':
          hero.setInput('up', true);
          break;
        case 's':
          hero.setInput('down', true);
          break;
        case 'a':
          hero.setInput('left', true);
          break;
        case 'd':
          hero.setInput('right', true);
          break;
      };
    });
    GM.registerHandler('KEY_UP', event => {
      const hero = this.heroes[event.socketIndex];
      switch (event.key) {
        case 'w':
          hero.setInput('up', false);
          break;
        case 's':
          hero.setInput('down', false);
          break;
        case 'a':
          hero.setInput('left', false);
          break;
        case 'd':
          hero.setInput('right', false);
          break;
      };
    });
  }

  onMessage(message, socketIndex) {
    super.onMessage(message, socketIndex);
    if (message.type === 'KEY_DOWN' || message.type === 'KEY_UP') {
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
}

const main = async () => {
  const server = new GameServer(2);
  server.initialize();

  WM.initialize();

  // Create the game timer
  const timer = new Timer(1 / REFRESH_RATE, dt => {
    GM.step(dt);
    WM.sync(server);
  });

  timer.start();
};

main().catch(console.err);
