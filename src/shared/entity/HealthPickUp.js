import PickUp from './PickUp';
import { isClient, registerEntity } from '../util/util';
import Explosion from './Explosion';
import GM from '../event/GameManager';

const COLOR = {
  red: 50,
  green: 255,
  blue: 50
};

const HEAL_AMOUNT = 20;

class HealthPickUp extends PickUp {
  constructor() {
    super();
  }

  cleanup() {
    // Create green explosion
    if (isClient()) {
      const explosion = new Explosion(COLOR, 30);
      explosion.setPosition(this.position);
      GM.addEntity(explosion);
    }

    super.cleanup();
  }

  initializeGraphics(two) {
    super.initializeGraphics(two);
    this.setColor(COLOR);
  }

  onPickUp(hero) {
    hero.damageAmount = Math.max(hero.damageAmount - HEAL_AMOUNT, 0);
  }
}

registerEntity(HealthPickUp);

export default HealthPickUp;