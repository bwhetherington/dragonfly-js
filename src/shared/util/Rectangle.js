class Rectangle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }

  containsXY(x, y) {
    const x1 = this.x;
    const y1 = this.y;
    const x2 = this.x + this.width;
    const y2 = this.y + this.height;
    return x1 <= x && x <= x2 && y1 <= y && y <= y2;
  }

  intersects(other) {
    const x1 = other.x;
    const y1 = other.y;
    const x2 = other.x + other.width;
    const y2 = other.y + other.height;

    return this.containsXY(x1, y1) || this.containsXY(x2, y2);
  }

  contains(other) {
    const x1 = this.x;
    const y1 = this.y;
    const x2 = this.x + this.width;
    const y2 = this.y + this.height;

    const x1 = other.x;
    const y1 = other.y;
    const x2 = other.x + other.width;
    const y2 = other.y + other.height;

    return this.containsXY(x1, y1) && this.containsXY(x2, y2);
  }
}