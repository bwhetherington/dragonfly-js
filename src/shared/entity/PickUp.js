import Entity from './Entity';
import GM from '../event/GameManager';
import Rectangle from '../util/Rectangle';
import WM from './WorldManager';
import { isClient } from '../util/util';
import AM from '../audio/AudioManager';
import Vector from '../util/Vector';

class PickUp extends Entity {
  constructor(givenVector = new Vector(0,0)) {
    super();
    this.position = givenVector;
  }

  initializeGraphics(two) {

  }

  serialize() {
    return {
      ...super.serialize(),
    };
  }

  deserialize(object) {
    super.deserialize(object);
  }

  cleanup() {
    super.cleanup();
  }
}

export default PickUp;