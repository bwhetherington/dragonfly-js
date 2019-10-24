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
    })
  }

  setSlow(value) {
    this.isSlow = value;
  }

  damage(amount) {
    this.damageAmount += amount;
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
      damageAmount: this.damageAmount
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

  deserialize(obj) {
    super.deserialize(obj);
    if (obj.playerID > -1) {
      this.playerID = obj.playerID;
    }
    if (obj.cannonAngle !== undefined) {
      this.rotateCannon(obj.cannonAngle);
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