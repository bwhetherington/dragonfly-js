class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  equals(vector) {
    const { x, y } = vector;
    return this.x === x && this.y === y;
  }

  setXY(x, y) {
    this.x = x;
    this.y = y;
  }

  setX(x) {
    this.x = x;
  }

  setY(y) {
    this.y = y;
  }

  set(vector) {
    const { x, y } = vector;
    this.x = x;
    this.y = y;
  }

  scale(scalar) {
    this.x *= scalar;
    this.y *= scalar;
  }

  normalize() {
    const magnitude = this.magnitude;
    if (magnitude === 0) {
      this.scale(0);
    } else {
      this.scale(1 / magnitude);
    }
  }

  add(vector) {
    const { x, y } = vector;
    this.addXY(x, y);
  }

  addXY(x, y) {
    this.x += x;
    this.y += y;
  }

  distance(vector) {
    const { x, y } = vector;
    const dx = x - this.x;
    const dy = x - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  get magnitude() {
    const { x, y } = this;
    return Math.sqrt(x * x + y * y);
  }

  deserialize(str) {
    const obj = JSON.parse(str);
    this.set(obj);
  }

  decay(amount = 1) {
    const magnitude = this.magnitude;

    if (magnitude > 0) {
      const cos = this.x / magnitude;
      const sin = this.y / magnitude;

      let decayX = amount * cos;
      let decayY = amount * sin;

      if (Math.abs(decayX) > Math.abs(this.x)) {
        decayX = this.x;
      }
      if (Math.abs(decayY) > Math.abs(this.y)) {
        decayY = this.y;
      }

      this.x -= decayX;
      this.y -= decayY;
    }
  }
}

export default Vector;