import { iterator } from "lazy-iters";
import Vector from "./Vector";
// import InverseRectangle from "./InverseRectangle";
import { Corner } from "../util/util";

class Rectangle {
  constructor(x, y, w, h) {
    this.type = "Rectangle";
    this.x = x - w / 2;
    this.y = y - h / 2;
    this.width = w;
    this.height = h;
  }

  get diagonal() {
    const { width, height } = this;
    return Math.sqrt(width * width + height * height);
  }

  getCorner(corner, to) {
    let x, y;
    switch (corner) {
      case Corner.TOP_LEFT:
        x = this.x;
        y = this.y;
        to.setXY(x, y);
        break;
      case Corner.TOP_RIGHT:
        x = this.x + this.width;
        y = this.y;
        to.setXY(x, y);
        break;
      case Corner.BOTTOM_LEFT:
        x = this.x;
        y = this.y + this.height;
        to.setXY(x, y);
        break;
      case Corner.BOTTOM_RIGHT:
        x = this.x + this.width;
        y = this.y + this.height;
        to.setXY(x, y);
        break;
    }
  }

  containsXY(x, y) {
    // const halfWidth = this.width / 2;
    // const halfHeight = this.height / 2;
    // const x1 = this.x - halfWidth;
    // const y1 = this.y - halfHeight;
    // const x2 = this.x + halfWidth;
    // const y2 = this.y + halfHeight;
    const x1 = this.x;
    const y1 = this.y;
    const x2 = this.x + this.width;
    const y2 = this.y + this.height;
    return x1 < x && x < x2 && y1 < y && y < y2;
  }

  intersects(other, first = true) {
    // const halfWidth = other.width / 2;
    // const halfHeight = other.height / 2;

    const tlX = other.x;
    const tlY = other.y;
    const trX = other.x + other.width;
    const trY = other.y;
    const blX = other.x;
    const blY = other.y + other.height;
    const brX = other.x + other.width;
    const brY = other.y + other.height;

    return (
      this.containsXY(tlX, tlY) ||
      this.containsXY(trX, trY) ||
      this.containsXY(blX, blY) ||
      this.containsXY(brX, brY) ||
      (first && other.intersects(this, false))
    );
  }

  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }

  setCenterXY(x, y) {
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
  }

  getAngleXY(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return 0;
    // return Math.atan2(-dy, dx);
  }

  *getVertices() {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    const x1 = this.x - halfWidth;
    const y1 = this.y - halfHeight;
    const x2 = this.x + halfWidth;
    const y2 = this.y + halfHeight;
    yield new Vector(x1, y1);
    yield new Vector(x2, y1);
    yield new Vector(x1, y2);
    yield new Vector(x2, y2);
  }

  *getVerticesOffset(normalOffset = 0) {
    if (normalOffset === 0) {
      yield* this.getVertices();
    } else {
      const iter = iterator(this.getVertices())
        .map((vertex) => {
          const angle = this.getAngleXY(vertex.x, vertex.y);
          vertex.offset(angle, -normalOffset);
          return vertex;
        })
        .collect();
      yield* iter;
    }
  }

  setCenter(vector) {
    const { x, y } = vector;
    this.setCenterXY(x, y);
  }

  contains(other) {
    const tlX = other.x;
    const tlY = other.y;
    const trX = other.x + other.width;
    const trY = other.y;
    const blX = other.x;
    const blY = other.y + other.height;
    const brX = other.x + other.width;
    const brY = other.y + other.height;

    return (
      this.containsXY(tlX, tlY) &&
      this.containsXY(trX, trY) &&
      this.containsXY(blX, blY) &&
      this.containsXY(brX, brY)
    );
  }

  containsPoint(x, y) {
    return this.containsXY(x, y);
  }

  serialize() {
    const { type, x, y, width, height } = this;
    return {
      type,
      x: x + width / 2,
      y: y + height / 2,
      width,
      height,
    };
  }

  addXY(x, y) {
    this.x += x;
    this.y += y;
  }

  add(vec, scalar = 1) {
    const { x, y } = vec;
    this.addXY(x * scalar, y * scalar);
  }
}

export default Rectangle;
