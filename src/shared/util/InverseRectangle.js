import Rectangle from './Rectangle';

class InverseRectangle extends Rectangle {
  intersects(other) {
    return !super.contains(other);
  }

  contains(other) {
    return !super.intersects(other);
  }
}

export default InverseRectangle;