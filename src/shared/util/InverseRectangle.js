import Rectangle from './Rectangle';

class InverseRectangle extends Rectangle {
  intersects(other) {
    return !super.contains(other);
  }

  contains(other) {
    return !super.intersects(other);
  }

  containsPoint(x, y) {
    return !super.containsXY(x, y);
  }

  getAngleXY(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.atan2(-dy, -dx);
  }
}

export default InverseRectangle;