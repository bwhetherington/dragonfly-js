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

const MOVEMENT_SPEED = 300;

const COLORS = [
  {
    red: 200,
    green: 80,
    blue: 50
  },
  {
    red: 50,
    green: 80,
    blue: 200
  }
];

class Hero extends Entity {
  constructor(playerID = -1) {
    super();
    // if (isClient()) {
    //   this.position = new Proxy(this.position, {
    //     get(obj, prop) {
    //       return obj[prop];
    //     },

    //     set(obj, prop, value) {
    //       obj[prop] = value;
    //       if (value === undefined || Number.isNaN(value)) {
    //         debugger;
    //         console.log(`${prop} = ${value}`);
    //       }
    //       return true;
    //     }
    //   });
    // }
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
    this.setWeapon(Raygun);
    this.friction = 1;
    this.bounce = 0.6;
    this.score = 0;
    this.deathTimer = -1;
    this.deathAmount = 1;
    this.invilTimer = -1;
    this.invilAmount = 2;


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
          if(isServer()){
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
              position: {x: 0, y: 0}
            }
          };
           GM.emitEvent(event);
          if(isServer()){
            NM.send(event);
          }
          this.invilTimer = this.invilAmount;
        }
      }
    });

    this.registerHandler('PLAYER_KILLED', event =>{
      const {deadID} = event;
       if(this.id === deadID){
        this.kill(0,0);
       }
    });

    this.registerHandler('RESPAWN', event => {
      const {id} = event;
      if(this.id === id){
        this.respawn(0,0);
      }
    });

    this.registerHandler('INVICIBILITY_END', event => {
      const {id} = event;
      if(this.id === id){
        this.endInvincibility();
      }
    });
  }

  setSlow(value) {
    this.isSlow = value;
  }

  damage(amount, killerID) {
    if (this.invilTimer !== -1) {
      return;
    }
    this.damageAmount += amount;
    this.updateColor();
    if (this.damageAmount >= 5) {
      const event = {
        type: 'PLAYER_KILLED',
        data: {
          deadID: this.id,
          killerID: killerID
        }
      };
       GM.emitEvent(event);
      if(isServer()){
        NM.send(event);
      }
      this.deathTimer = this.deathAmount;
    }
  }

  endInvincibility(){
    this.updateOpacity(1);
  }

  kill(x = 0, y = 0) {
    this.damageAmount = 0;
    this.velocity.setXY(0, 0);
    this.setPositionXY(x, y);
    this.updateOpacity(0);
    this.isCollidable = false;
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

  serialize() {
    const obj = {
      ...super.serialize(),
      playerID: this.playerID,
      cannonAngle: this.cannonAngle,
      damageAmount: this.damageAmount,
      score: this.score
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
    if (this.isCurrentHero()) {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (0 < dist && dist < 100 && obj.deathTimer === -1 && this.deathTimer === -1) {
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
      this.score = obj.score;
    }
    if (obj.damageAmount !== undefined) {
      this.damageAmount = obj.damageAmount;
    }
    if (obj.weapon !== undefined) {
      if (obj.type !== this.weapon.type) {
        // this.setWeapon()
      } else {
        this.weapon.deserialize(obj.weapon);
      }
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

    this.graphicsObject = two.makeGroup(object, cannonGroup);
    this.graphicsObject.translation.set(this.position.x, this.position.y);
    this.setColor(COLORS[this.playerID % 2]);
  }

  setWeapon(WeaponClass) {
    if (this.weapon instanceof Weapon) {
      this.weapon.cleanup();
    }
    this.weapon = new WeaponClass();
  }
}

export default Hero;