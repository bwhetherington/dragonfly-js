import Entity from './Entity';
import Vector from '../util/Vector';
import GM from '../event/GameManager';
import Projectile from './Projectile';
import WM from './WorldManager';
import AM from '../audio/AudioManager';
import Ray from './Ray';
import Pistol from './Pistol';
import Shotgun from './Shotgun';
import Raygun from './Raygun';
import Weapon from './Weapon';
import { isServer, isClient } from '../util/util';
import NM from '../network/NetworkManager';
import Explosion from './Explosion';
import SETTINGS from '../util/settings';
import WeaponPickUp from './WeaponPickUp';

const MOVEMENT_SPEED = 300;

const colorOptions = ['red', 'green', 'blue', 'yellow'];

const COLORS = {
  red: {
    red: 200,
    green: 80,
    blue: 50
  },
  green: {
    red: 80,
    green: 120,
    blue: 50
  },
  yellow: {
    red: 200,
    green: 200,
    blue: 50
  },
  blue: {
    red: 50,
    green: 80,
    blue: 200
  }
};

const COLORS_LIST = Object.keys(COLORS).map(key => COLORS[key]);

class Hero extends Entity {
  constructor(playerID = -1) {
    super();
    this.maxDamage = 1;
    this.movementSpeed = MOVEMENT_SPEED;
    this.playerID = playerID;
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    this.damageAmount = 0;
    this.cannonAngle = 0;
    this.setWeapon('Pistol');
    this.friction = 1;
    this.bounce = 0.2;
    this.score = 0;
    this.deathTimer = -1;
    this.deathAmount = 1;
    this.invilTimer = -1;
    this.invilAmount = 2;
    this.regen = 2;
    this.lives = 1;


    this.registerHandler('OBJECT_COLLISION', event => {
      const { object1, object2 } = event;
      let other = null;
      if (object1.id === this.id) {
        if (object2 instanceof Hero) {
          other = object2;
        }
      }
      if (object2.id === this.id) {
        if (object1 instanceof Hero) {
          other = object1;
        }
      }
      if (other !== null) {
        const vector = new Vector(0, 0);
        vector.add(other.position);
        vector.subtract(this.position);
        vector.normalize();
        vector.scale(2);
        other.applyForce(vector);
      }
    });

    this.registerHandler('STEP', event => {
      const { dt } = event;
      if (isClient()) {
        return;
      }

      // Regen
      this.damageAmount = Math.max(this.damageAmount - dt * this.regen, 0);

      if (this.invilTimer !== -1) {
        this.invilTimer -= dt;
        if (this.invilTimer <= 0) {
          this.invilTimer = -1;
          const event = {
            type: 'INVICIBILITY_END',
            data: {
              id: this.id,
            }
          };
          GM.emitEvent(event);
          if (isServer()) {
            NM.send(event);
          }
        }
      }

      if (this.deathTimer !== -1) {
        this.deathTimer -= dt;
        if (this.deathTimer <= 0) {
          this.deathTimer = -1;
          const event = {
            type: 'RESPAWN',
            data: {
              id: this.id,
              position: { x: 0, y: 0 }
            }
          };
          GM.emitEvent(event);
          if (isServer()) {
            NM.send(event);
          }
          this.invilTimer = this.invilAmount;
        }
      }
    });

    this.registerHandler('PLAYER_KILLED', event => {
      const { deadID } = event;
      if (this.id === deadID) {
        this.kill(0, 0);
      }
    });

    this.registerHandler('RESPAWN', event => {
      const { id } = event;
      if (this.id === id) {
        this.respawn(0, 0);
      }
    });

    this.registerHandler('INVICIBILITY_END', event => {
      const { id } = event;
      if (this.id === id) {
        this.endInvincibility();
      }
    });

    this.registerHandler('RESET_GAME', event => {
      this.reset();
      this.makeIntangible();
    });

    this.registerHandler('REJOIN_GAME', event => {
      const { heroID } = event;
      if(this.id === heroID){
        this.makeTangible();
      }
    });
  }

  dropWeapon() {
    const { weapon } = this;
    if (weapon && weapon.type !== 'Pistol') {
      const pickup = new WeaponPickUp(weapon.type);
      pickup.setPosition(this.position);
      WM.add(pickup);
      this.setWeapon('Pistol');
    }
  }

  setSlow(value) {
    this.isSlow = value;
  }

  damage(amount, sourceID) {
    if (this.invilTimer !== -1) {
      return;
    }
    this.damageAmount += amount;

    if (isServer()) {
      const damager = WM.findByID(sourceID);
      if (damager instanceof Hero) {
        damager.score += amount;
      }
    }

    if (this.damageAmount >= this.maxDamage) {
      const event = {
        type: 'PLAYER_KILLED',
        data: {
          deadID: this.id,
          killerID: sourceID
        }
      };
      this.lives -= 1;
      GM.emitEvent(event);
      if (isServer()) {
        NM.send(event);
      }
    }
  }

  endInvincibility() {
    this.updateOpacity(1);
    this.invilTimer = -1;
  }

  kill(x = 0, y = 0) {
    // Show explosion
    if (isClient()) {
      const explosion = new Explosion(2);
      explosion.setPosition(this.position);
      WM.add(explosion);
    } else {
      this.dropWeapon();
    }

    this.damageAmount = 0;
    this.velocity.setXY(0, 0);
    this.setPositionXY(x, y);
    this.updateOpacity(0);
    this.isCollidable = false;
    if(this.lives > 0){
      this.deathTimer = this.deathAmount;
    }
  }

  respawn(x = 0, y = 0) {
    this.setPositionXY(x, y);
    this.updateOpacity(0.8);
    this.isCollidable = true;
  }

  setInput(direction, on) {
    const { input } = this;
    this.input[direction] = on;

    // Calculate velocity from this
    this.acceleration.setXY(0, 0);
    if (input.up) {
      this.acceleration.setY(this.acceleration.y - 1);
    }
    if (input.down) {
      this.acceleration.setY(this.acceleration.y + 1);
    }
    if (input.left) {
      this.acceleration.setX(this.acceleration.x - 1);
    }
    if (input.right) {
      this.acceleration.setX(this.acceleration.x + 1);
    }
    this.acceleration.normalize();
    this.acceleration.scale(this.movementSpeed);
  }

  createOffset(magnitude = 0.1) {
    return (Math.random() - 0.5) * 2 * magnitude;
  }

  reset(){
    this.maxDamage = 1;
    this.movementSpeed = MOVEMENT_SPEED;
    this.damageAmount = 0;
    this.setWeapon('Pistol');
    this.friction = 1;
    this.bounce = 0.2;
    this.score = 0;
    this.deathTimer = -1;
    this.deathAmount = 1;
    this.invilTimer = -1;
    this.invilAmount = 2;
    this.regen = 2;
    this.lives = 1;
  }

  makeIntangible(){
    console.log('made ' + this.id + ' Intagible');
    this.updateOpacity(0);
    this.isCollidable = false;
  }

  makeTangible(){
    console.log('made ' + this.id + ' Tangible')
    this.updateOpacity(1);
    this.isCollidable = true;
  }

  serialize() {
    const obj = {
      ...super.serialize(),
      playerID: this.playerID,
      cannonAngle: this.cannonAngle,
      damageAmount: this.damageAmount,
      score: this.score,
      deathTimer: this.deathTimer,
      name: this.name
    };
    if (this.weapon instanceof Weapon) {
      obj.weapon = this.weapon.serialize();
    }
    return obj;
  }

  rotateCannon(angle) {
    this.cannonAngle = angle;
    if (this.cannon) {
      this.cannon.rotation = angle;
    }
  }

  isCurrentHero() {
    return GM.hero && this.playerID === GM.hero.playerID;
  }

  deserialize(obj) {
    const { x: x0, y: y0 } = this.position;
    const { x: vx, y: vy } = this.velocity;
    const { x: ax, y: ay } = this.acceleration;
    super.deserialize(obj);
    const { x: x1, y: y1 } = this.position;
    if (SETTINGS.predictionEnabled && this.isCurrentHero()) {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (0 < dist && dist < 200 && obj.deathTimer === -1) {
        this.position.setXY(x0, y0);
        this.velocity.setXY(vx, vy);
        this.acceleration.setXY(ax, ay);
        NM.send({
          type: 'SYNC_OBJECT',
          data: {
            object: {
              id: this.id,
              position: this.position,
              velocity: this.velocity,
              acceleration: this.acceleration
            }
          }
        });
      }
      this.updatePosition();
    }

    if (obj.playerID > -1) {
      this.playerID = obj.playerID;
    }
    if (obj.cannonAngle !== undefined && !this.isCurrentHero()) {
      this.rotateCannon(obj.cannonAngle);
    }
    if (obj.score !== undefined) {
      if (this.score !== obj.score) {
        this.score = obj.score;

        const event = {
          type: 'UPDATE_SCORE',
          data: {
            id: this.playerID,
            score: this.score
          }
        };
        GM.emitEvent(event);
      }
    }
    if (obj.damageAmount !== undefined) {
      this.damageAmount = obj.damageAmount;
    }
    if (obj.weapon !== undefined) {
      if (obj.weapon.type !== this.weapon.type) {
        this.setWeapon(obj.weapon.type)
      }
      this.weapon.deserialize(obj.weapon);

    }
    if (obj.name !== undefined) {
      this.name = obj.name;
    }
  }

  fireXY(fx, fy) {
    this.weapon.fireInternal(fx, fy, this);
  }

  get isInvincible() {
    return this.invilTimer !== -1;
  }

  initializeGraphics(two) {
    const object = two.makeRectangle(0, 0, 30, 30);
    object.linewidth = 5;

    const cannon = two.makeRectangle(0, -10, 10, 30);
    cannon.linewidth = 5;
    const cannonGroup = two.makeGroup(cannon);
    cannonGroup.rotation = 1;
    // cannonGroup.translation.set(this.position.x, this.position.y);
    this.cannon = cannonGroup;

    this.colorObject = two.makeGroup(object, cannonGroup);
    this.graphicsObject = this.colorObject;
    this.graphicsObject.translation.set(this.position.x, this.position.y);

    // Select color
    const color = COLORS_LIST[this.playerID % COLORS_LIST.length];
    this.setColor(color);
    // if (colorOptions.length > 0) {
    //   const index = Math.floor(Math.random() * colorOptions.length);
    //   const color = colorOptions.splice(index, 1);

    //   const colorObject = COLORS[color];
    //   this.setColor(colorObject);
    //   this.colorString = color;
    // }
  }

  setWeapon(type) {
    // If this is the same weapon type as what we already have, do nothing
    if (!(this.weapon && type === this.weapon.type)) {
      let weapon = null;
      switch (type) {
        case 'Pistol':
          weapon = new Pistol();
          break;
        case 'Raygun':
          weapon = new Raygun();
          break;
        case 'Shotgun':
          weapon = new Shotgun();
          break;
      }
      if (weapon) {
        if (this.weapon) {
          this.weapon.cleanup();
        }
        this.weapon = weapon;
      }
    }
  }

  cleanup() {
    if (this.colorString) {
      // Free color
      colorOptions.push(this.colorString);
    }
    if (this.weapon) {
      this.weapon.cleanup();
    }
    return super.cleanup();
  }
}

export default Hero;