class Rectangle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }

  containsXY(x, y) {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    const x1 = this.x - halfWidth;
    const y1 = this.y - halfHeight;
    const x2 = this.x + halfWidth;
    const y2 = this.y + halfHeight;
    return x1 <= x && x <= x2 && y1 <= y && y <= y2;
  }

  intersects(other, first = true) {
    const halfWidth = other.width / 2;
    const halfHeight = other.height / 2;

    const tlX = other.x - halfWidth;
    const tlY = other.y - halfHeight;
    const trX = other.x + halfWidth;
    const trY = other.y - halfHeight;
    const blX = other.x - halfWidth;
    const blY = other.y + halfHeight;
    const brX = other.x + halfWidth;
    const brY = other.y + halfHeight;

    return (this.containsXY(tlX, tlY) ||
      this.containsXY(trX, trY) ||
      this.containsXY(blX, blY) ||
      this.containsXY(brX, brY)) || (first && other.intersects(this, false));
  }

  setCenterXY(x, y) {
    this.x = x;
    this.y = y;
  }

  setCenter(vector) {
    this.x = vector.x;
    this.y = vector.y;
  }

  contains(other) {
    const halfWidth = other.width / 2;
    const halfHeight = other.height / 2;

    const tlX = other.x - halfWidth;
    const tlY = other.y - halfHeight;

    const trX = other.x + halfWidth;
    const trY = other.y - halfHeight;

    const blX = other.x - halfWidth;
    const blY = other.y + halfHeight;

    const brX = other.x + halfWidth;
    const brY = other.y + halfHeight;

    return this.containsXY(tlX, tlY) &&
      this.containsXY(trX, trY) &&
      this.containsXY(blX, blY) &&
      this.containsXY(brX, brY);
  }

  containsPoint(x, y) {
    return this.containsXY(x, y);
  }
}

export default Rectangle;