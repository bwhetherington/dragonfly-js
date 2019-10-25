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
import ShotgunPickUp from '../shared/entity/ShotgunPickUp';
import Pistol from '../shared/entity/Pistol';

class GameClient extends Client {
  constructor(two, addr) {
    super(two, addr);
    this.heroes = {};
    this.playerID = -2;
  }

  initializeUI() {
    let lastFPS = 60;

    const PING_INTERVAL = 0.5;

    let timer = 0;
    GM.registerHandler('STEP', async event => {
      const { dt } = event;
      timer += dt;

      if (timer >= PING_INTERVAL) {
        const ping = await this.getPing();
        const pingLabel = document.getElementById('ping');
        pingLabel.innerText = ping;
        timer -= PING_INTERVAL;
      }

      let hits = 0;
      let score = 0;
      const { hero } = this;

      if (hero) {
        hits = hero.damageAmount;
        score = hero.score;
      }

      const curFPS = 1 / dt;
      // Smooth fps slightly
      const fps = Math.round(0.7 * curFPS + 0.3 * lastFPS);
      lastFPS = curFPS;

      const entityCount = WM.entityCount;
      const listenerCount = GM.handlerCount;

      const hitLabel = document.getElementById('hit-count');
      hitLabel.innerText = hits;

      const scoreLabel = document.getElementById('score-count');
      scoreLabel.innerText = score;

      const entityLabel = document.getElementById('entity-count');
      entityLabel.innerText = entityCount;

      const listenerLabel = document.getElementById('listener-count');
      listenerLabel.innerText = listenerCount;

      const fpsLabel = document.getElementById('fps');
      fpsLabel.innerText = fps;
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
          case 'KeyF':
            hero.applyForce(new Vector(100, 0));
            break;
          case 'KeyQ':
            hero.setWeapon(Pistol);
            break;
          case 'KeyP':
            (async () => {
              const ping = await this.getPing();
              console.log('ping', ping);
            })();
            break;
          case 'ShiftLeft':
          case 'ShiftRight':
            hero.setSlow(true);
            break;
        };
      }

      this.send({
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

      this.send({
        type: 'KEY_UP',
        data: event
      });
    });

    GM.registerHandler('MOUSE_DOWN', event => {
      // Create a laser to test
      // const laser = new Laser(this.hero.position, new Vector(event.position.x, event.position.y));
      // WM.add(laser);

      this.send({
        type: 'MOUSE_DOWN',
        data: event
      });
    });

    GM.registerHandler('MOUSE_UP', event => {
      this.send({
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

  initializeHero(hero) {
    this.hero = hero;
    GM.hero = hero;
    this.attachCamera(hero);
    hero.registerHandler('MOUSE_MOVE', event => {
      const { x, y } = event.position;

      const dx = x - hero.position.x;
      const dy = y - hero.position.y;

      const angle = Math.atan2(dy, dx) + Math.PI / 2;
      if (hero.cannon) {
        hero.rotateCannon(angle);
        const event = {
          type: 'ROTATE_CANNON',
          data: {
            playerID: hero.playerID,
            angle: angle
          }
        };
        GM.emitEvent(event);
      }
    });
  }

  initialize(window) {
    super.initialize(window);

    this.registerInput();
    this.initializeUI();

    WM.setEntityGenerator(type => this.createEntity(type));

    GM.registerHandler('CLEANUP_GRAPHICS', event => {
      const { object } = event;
      this.two.remove(object);
    });

    GM.registerHandler('CREATE_OBJECT', event => {
      const { object } = event;
      if (object.type === 'Hero' && object.playerID === this.playerID) {
        this.initializeHero(object);
      }
    })

    GM.registerHandler('CREATE_RAY', event => {
      const { start, end } = event;
      const p0 = new Vector(start.x, start.y);
      const p1 = new Vector(end.x, end.y);
      const laser = new Laser(p0, p1);
      WM.add(laser);

      const explosion = new Explosion();
      explosion.setPosition(p1);
      WM.add(explosion);
    });

    GM.registerHandler('ROTATE_CANNON', event => {
      const packet = {
        type: 'ROTATE_CANNON',
        data: event
      };
      this.send(packet);
    });

    GM.registerHandler('PLAY_AUDIO', data => {
      AM.playSoundInternal(data.filename, data.volume);
    });
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
        return entity;
      case 'Hero':
        const hero = new Hero();
        return hero;
      case 'Projectile':
        const projectile = new Projectile();
        return projectile;
      case 'Explosion':
        const explosion = new Explosion();
        return explosion;
      case 'ShotgunPickUp':
        const shotgunPickUp = new ShotgunPickUp();
        return shotgunPickUp;
      default:
        return null;
    }
  }
}

export default GameClient;