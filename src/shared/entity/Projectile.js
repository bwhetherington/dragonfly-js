import Entity from './Entity';
import GM from '../event/GameManager';
import Rectangle from '../util/Rectangle';

class Projectile extends Entity {
  constructor(sourceID = null) {
    super();
    this.sourceID = sourceID;
    this.boundingBox = new Rectangle(0, 0, 10, 10);
    this.updatePosition();

    this.registerHandler('GEOMETRY_COLLISION', event => {
      const { object } = event;
      if (object.id === this.id) {
        this.markForDelete();
      }
    })

    this.registerHandler('OBJECT_COLLISION', event => {
      const { object1, object2 } = event;
      if (object1.id === this.id) {
        if (object2.id !== this.sourceID) {
          this.hit(object2);
          this.markForDelete();
        }
      } else if (object2.id === this.id) {
        if (object1.id !== this.sourceID) {
          this.hit(object1);
          this.markForDelete();
        }
      }
    });
  }

  initializeGraphics(two) {
    const object = two.makeCircle(0, 0, 10);
    object.fill = '#FF8000';
    object.stroke = 'orangered'; // Accepts all valid css color
    object.linewidth = 5;
    this.graphicsObject = object;
  }

  hit(entity) {
    entity.damage(1);
  }

  serialize() {
    return {
      ...super.serialize(),
      sourceID: this.sourceID
    };
  }

  deserialize(object) {
    super.deserialize(object);
    const { sourceID } = object;
    if (sourceID) {
      this.sourceID = sourceID;
    }
  }
}

export default Projectile;