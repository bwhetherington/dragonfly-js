import Entity from './Entity';

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
    this.velocity.scale(80);
  }
}

export default Hero;