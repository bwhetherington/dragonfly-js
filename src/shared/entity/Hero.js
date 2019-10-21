import Entity from './Entity';

const MOVEMENT_SPEED = 100;

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
}

export default Hero;