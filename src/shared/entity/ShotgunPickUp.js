import GM from '../event/GameManager';
import Rectangle from '../util/Rectangle';
import Explosion from './Explosion';
import WM from './WorldManager';
import { isClient } from '../util/util';
import AM from '../audio/AudioManager';
import Shotgun from './Shotgun';
import Vector from '../util/Vector';
import Hero from '../entity/Hero';
import PickUp from './PickUp';

class ShotgunPickUp extends PickUp {
  constructor(givenVector = new Vector(0, 0)) {
    super();
    this.position = givenVector;
    this.boundingBox = new Rectangle(0, 0, 20, 20);
    if (!isClient()) {
      this.registerHandler('OBJECT_COLLISION', event => {
        const { object1, object2 } = event;
        let other = null;
        if (object1.id === this.id) {
          if (object2.id !== this.sourceID && !(object2 instanceof ShotgunPickUp)) {
            other = object2;
          }
        } else if (object2.id === this.id) {
          if (object1.id !== this.sourceID && !(object1 instanceof ShotgunPickUp)) {
            other = object1;
          }
        }
        if (other !== null) {
          if (other instanceof Hero) {
            other.setWeapon(Shotgun);
            this.markForDelete();
          }
        }
      });
    }
  }

  initializeGraphics(two) {
    const circle = two.makeCircle(this.position.x, this.position.y, 10);
    circle.fill = 'rgba(63, 191, 127, 0.8)';
    circle.stroke = 'rgba(25, 76, 51, 0.6)';
    circle.linewidth = 5;
    this.graphicsObject = circle;
  }

  // serialize() {
  //   return {
  //     ...super.serialize(),
  //   };
  // }

  // deserialize(object) {
  //   super.deserialize(object);
  // }

  cleanup() {
    super.cleanup();
  }
}

export default ShotgunPickUp;