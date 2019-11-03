import PickUp from './PickUp';
import { isClient } from '../util/util';
import Explosion from './Explosion';
import WM from './WorldManager';

const COLOR = {
  red: 50,
  green: 255,
  blue: 50
};

class HealthPickUp extends PickUp {
  constructor() {
    super();
  }

  cleanup() {
    super.cleanup();
  }

  initializeGraphics(two) {
    super.initializeGraphics(two);
    this.setColor(COLOR);
  }

  onPickUp(hero) {
    hero.damageAmount = Math.max(hero.damageAmount - 50, 0);
  }
}

export default HealthPickUp;