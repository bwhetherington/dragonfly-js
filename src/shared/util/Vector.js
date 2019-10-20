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

  set(vector) {
    const { x, y } = vector;
    this.x = x;
    this.y = y;
  }

  scale(scalar) {
    this.x *= scalar;
    this.y *= scalar;
  }

  add(vector) {
    const { x, y } = vector;
    this.x += x;
    this.y += y;
  }

  distance(vector) {
    const { x, y } = vector;
    const dx = x - this.x;
    const dy = x - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  magnitude() {
    const { x, y } = this;
    return Math.sqrt(x * x + y * y);
  }

  deserialize(str) {
    const obj = JSON.parse(str);
    this.set(obj);
  }
}

export default Vector;