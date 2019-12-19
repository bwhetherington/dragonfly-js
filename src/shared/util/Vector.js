import encoder from "./Encoder";

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static fromVector(point) {
    return new Vector(point.x, point.y);
  }

  static fromPolar(r, theta) {
    const x = Math.cos(theta) * r;
    const y = Math.sin(theta) * r;
    return new Vector(x, y);
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
    this.setXY(x, this.y);
  }

  setY(y) {
    this.setXY(this.x, y);
  }

  set(vector) {
    // if (!vector) {
    //   debugger;
    // }
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

  clone() {
    return new Vector(this.x, this.y);
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

  offset(angle, amount) {
    this.x += Math.cos(angle) * amount;
    this.y += Math.sin(angle) * amount;
  }

  serialize() {
    // let x = encoder.encode(this.x);
    // let y = encoder.encode(this.y);
    const { x, y } = this;
    // console.log(encoder.decode(ex), encoder.decode(ey), this.x, this.y);
    return {
      x,
      y
    };
  }

  deserialize(obj) {
    const { x, y } = obj;
    this.setXY(x, y);
    // this.setXY(encoder.decode(x), encoder.decode(y));
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
