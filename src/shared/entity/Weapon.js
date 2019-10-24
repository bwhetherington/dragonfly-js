import Entity from './Entity';
import GM from '../event/GameManager';
import WM from './WorldManager';
import { isClient } from '../util/util';
import AM from '../audio/AudioManager';

class Weapon extends Entity {
  constructor(sourceID = null) {
    super();
  }

  fire(fx, fy, sourceHero){
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

export default Weapon;