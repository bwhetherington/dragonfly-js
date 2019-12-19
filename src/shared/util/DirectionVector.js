import Vector from "./Vector";

class DirectionVector extends Vector {
  constructor(x, y) {
    super(x, y);
    this.direction = Math.atan2(y, x) || 0;
  }

  getDirection() {
    return this.direction;
  }

  setXY(x, y) {
    const oldDirection = this.direction;
    super.setXY(x, y);
    this.direction = Math.atan2(y, x) || oldDirection;
  }
}

export default DirectionVector;
