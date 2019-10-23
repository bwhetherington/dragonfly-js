import Entity from './Entity';
import Vector from '../util/Vector';
import GM from '../event/GameManager';
import Projectile from './Projectile';
import WM from './WorldManager';
import AM from '../audio/AudioManager';

const MOVEMENT_SPEED = 300;

const createOffset = (magnitude = 0.1) => {
  return (Math.random() - 0.5) * 2 * magnitude;
}

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
    this.updateColor();
  }

  setInput(direction, on) {
    const { input } = this;
    this.input[direction] = on;

    // Calculate velocity from this
    this.velocity.setXY(0, 0);
    if (input.up) {
      this.velocity.setY(this.velocity.y - 1);
    }
    if (input.down) {
      this.velocity.setY(this.velocity.y + 1);
    }
    if (input.left) {
      this.velocity.setX(this.velocity.x - 1);
    }
    if (input.right) {
      this.velocity.setX(this.velocity.x + 1);
    }
    this.velocity.normalize();
    this.velocity.scale(this.movementSpeed);
  }

  serialize() {
    return {
      ...super.serialize(),
      playerID: this.playerID,
      cannonAngle: this.cannonAngle,
      damageAmount: this.damageAmount
    };
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
      this.updateColor();
    }
  }

  fireXY(fx, fy) {
    AM.playSound('fire.wav');

    const vector = new Vector(0, 0);
    const offset = new Vector(0, 0);

    // Create direction vector to target
    const { x, y } = this.position;
    vector.setXY(fx - x, fy - y);
    vector.normalize();

    vector.addXY(createOffset(0.1), createOffset(0.1));
    vector.normalize();

    const bullet = new Projectile(this.id);
    bullet.velocity.set(vector);

    offset.set(vector);
    offset.normalize();
    offset.scale(20);

    bullet.velocity.scale(650);
    bullet.setPosition(this.position);
    bullet.position.add(offset);
    WM.add(bullet);
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
    this.updateColor();
  }
}

export default Hero;