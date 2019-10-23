import Entity from './Entity';
import Vector from '../util/Vector';
import GM from '../event/GameManager';
import Projectile from './Projectile';
import WM from './WorldManager';

const MOVEMENT_SPEED = 300;

class Hero extends Entity {
  constructor(playerID = -1) {
    super();
    this.playerID = playerID;
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    this.damageAmount = 0;
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
    this.velocity.scale(MOVEMENT_SPEED);
  }

  serialize() {
    return {
      ...super.serialize(),
      playerID: this.playerID
    };
  }

  deserialize(obj) {
    super.deserialize(obj);
    if (obj.playerID > -1) {
      this.playerID = obj.playerID;
    }
  }

  fireXY(fx, fy) {
    const vector = new Vector(0, 0);

    // Create direction vector to target
    const { x, y } = this.position;
    vector.setXY(fx - x, fy - y);
    vector.normalize();

    const bullet = new Projectile(this.id);
    bullet.velocity.set(vector);
    bullet.velocity.scale(500);
    bullet.setPosition(this.position);
    WM.add(bullet);
  }
}

export default Hero;