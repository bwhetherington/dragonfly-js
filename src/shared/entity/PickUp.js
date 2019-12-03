import Entity from './Entity';
import Rectangle from '../util/Rectangle';
import { isServer, registerEntity } from '../util/util';
import Hero from './Hero';
import GM from '../event/GameManager';

class PickUp extends Entity {
  constructor() {
    super();
    this.boundingBox = new Rectangle(0, 0, 20, 20);
    this.isCollidable = false;
    this.isSpectral = true;
    this.opacity = 0.5;

    if (isServer()) {

      GM.runDelay(5, () => {
        this.isCollidable = true;
        this.updateOpacity(1);
      });

      this.registerHandler('OBJECT_COLLISION', event => {
        const { object1, object2 } = event;
        let other = null;
        if (object1.id === this.id) {
          if (object2.id !== this.sourceID && object2 instanceof Hero) {
            other = object2;
          }
        } else if (object2.id === this.id) {
          if (object1.id !== this.sourceID && object1 instanceof Hero) {
            other = object1;
          }
        }
        if (other !== null) {
          this.onPickUp(other);
          this.markForDelete();
        }
      });
    }
  }

  initializeGraphics(two) {
    const square = two.makeRoundedRectangle(this.position.x, this.position.y, 20, 20, 4);
    square.linewidth = 5;
    this.graphicsObject = square;
  }

  onPickUp(hero) {
  }
}

registerEntity(PickUp);

export default PickUp;