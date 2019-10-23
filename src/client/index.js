import Two from 'twojs-ts';
import './index.css';
import Client from './GameClient';
import Entity from '../shared/entity/Entity';
import WM from '../shared/entity/WorldManager';
import Hero from '../shared/entity/Hero';
import GM from '../shared/event/GameManager';
import Projectile from '../shared/entity/Projectile';

const removeChildren = element => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

class GameClient extends Client {
  constructor(two, addr) {
    super(two, addr);
    this.heroes = {};
    this.playerID = -2;
  }

  attachCamera(entity) {
    GM.registerHandler('STEP', () => {
      const centerX = (this.two.width / 2 - entity.position.x);
      const centerY = (this.two.height / 2 - entity.position.y);
      this.two.scene.translation.set(centerX, centerY);
    });
  }

  initialize(window) {
    super.initialize(window);
    WM.setEntityGenerator(type => this.createEntity(type));

    GM.registerHandler('CLEANUP_GRAPHICS', event => {
      const { object } = event;
      this.two.remove(object);
    });

    GM.registerHandler('CREATE_OBJECT', event => {
      const { object } = event;
      if (object.type === 'Hero' && object.playerID === this.playerID) {
        this.hero = object;
        this.attachCamera(object);
      }
    })

    // Initialize grid
  }

  onMessage(message) {
    if (message.type === 'ASSIGN_ID') {
      this.playerID = message.data.playerID;
    } else {
      super.onMessage(message);
    }
  }

  createEntity(type) {
    switch (type) {
      case 'Entity':
        const entity = new Entity();
        entity.initializeGraphics(this.two);
        return entity;
      case 'Hero':
        const hero = new Hero();
        hero.initializeGraphics(this.two);
        return hero;
      case 'Projectile':
        const projectile = new Projectile();
        projectile.initializeGraphics(this.two);
        return projectile;
      default:
        return null;
    }
  }
}

const main = async () => {
  const element = document.getElementById('game');
  removeChildren(element);
  const two = new Two({
    fullscreen: true,
    autostart: true
  }).appendTo(element);

  two.scene.translation.set(100, 100);

  const makeLine = (two, x1, y1, x2, y2, color = '#f0f0f0', width = 2) => {
    const line = two.makeLine(x1, y1, x2, y2);
    line.stroke = color;
    line.linewidth = width;
  };

  const makeBounds = (two, x, y, width, height) => {
    const rect = two.makeRectangle(x, y, width, height);
    rect.fill = 'white';

    // Define grid
    const GRID_SIZE = 20;

    x -= width / 2;
    y -= height / 2;

    // Horizontal
    for (let i = GRID_SIZE; i <= width - GRID_SIZE; i += GRID_SIZE) {
      makeLine(two, x, y + i, x + width, y + i);
      makeLine(two, x + i, y, x + i, y + height);
    }

    // Define horizontal bars
    const border = two.makeRectangle(x + width / 2, y + width / 2, width, height);
    border.fill = 'rgba(0, 0, 0, 0)';
    border.stroke = '#a0a0a0';
    border.linewidth = 5;
  };

  GM.registerHandler('DEFINE_ARENA', event => {
    const { geometry } = event;
    WM.setGeomtetry(geometry);
    for (const shape of geometry) {
      const { type, x, y, width, height } = shape;
      switch (type) {
        case 'InverseRectangle':
          // An InverseRectangle represents the outer bounds
          makeBounds(two, x, y, width, height);
          break;
        case 'Rectangle':
          const rectangle = two.makeRectangle(x, y, width, height);
          rectangle.fill = 'black';
          rectangle.stroke = '#a0a0a0';
          rectangle.linewidth = 5;
          break;
      }
    }
  })

  WM.initialize();
  // Start websocket client
  const client = new GameClient(two);
  client.initialize(window);
};

main();

// if (module.hot) {
//   module.hot.accept();
// }
