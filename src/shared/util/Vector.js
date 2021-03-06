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

  clone() {
    return new Vector(this.x, this.y);
  }

  normalize() {
    const magnitude = this.magnitude;
    if (magnitude === 0) {
      this.scale(0);
    } else {
      this.scale(1 / magnitude);
    }
  }

  add(vector, scale = 1) {
    const { x, y } = vector;
    this.addXY(x * scale, y * scale);
  }

  subtract(vector) {
    const { x, y } = vector;
    this.subtractXY(x, y);
  }

  addXY(x, y) {
    this.x += x;
    this.y += y;
  }

  subtractXY(x, y) {
    this.x -= x;
    this.y -= y;
  }

  distance(vector) {
    const { x, y } = vector;
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  get magnitude() {
    const { x, y } = this;
    return Math.sqrt(x * x + y * y);
  }

  get angle() {
    const { x, y } = this;
    return Math.atan2(y, x);
  }

  angleTo(vector) {
    const { x, y } = vector;
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.atan2(dy, dx);
  }

  deserialize(str) {
    const obj = JSON.parse(str);
    this.set(obj);
  }

  dotProduct(vector) {
    const { x, y } = vector;
    return this.x * x + this.y * y;
  }

  projection(vector) {
    const dot = this.dotProduct(vector);
    const magnitude = this.magnitude;
    if (magnitude === 0) {
      return 0;
    } else {
      return dot / magnitude;
    }
  }

  decay(amount = 2) {
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

  addToZero(vector) {
    let newX = vector.x + this.x;
    let newY = vector.y + this.y;

    if (Math.sign(newX) !== Math.sign(this.x)) {
      newX = 0;
    }
    if (Math.sign(newY) !== Math.sign(this.y)) {
      newY = 0;
    }

    this.x = newX;
    this.y = newY;
  }

  subtractToZero(vector) {
    let newX = this.x - vector.y;
    let newY = this.y - vector.y;

    if (Math.sign(newX) !== Math.sign(this.x)) {
      newX = 0;
    }
    if (Math.sign(newY) !== Math.sign(this.y)) {
      newY = 0;
    }

    this.x = newX;
    this.y = newY;
  }
}

export default Vector;