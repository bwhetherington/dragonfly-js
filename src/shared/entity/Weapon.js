import Entity from './Entity';
import GM from '../event/GameManager';
import WM from './WorldManager';
import { isClient } from '../util/util';
import AM from '../audio/AudioManager';

class Weapon {
  constructor(delayAmount = 0.5) {
    this.delayTimer = 0;
    this.delayAmount = delayAmount;
    this.removeHandler = null;

    GM.registerHandler('STEP', (event, remove) => {
      this.removeHandler = remove;
      const { dt } = event;
      if (this.delayTimer !== 0) {
        this.delayTimer -= dt;
        if (this.delayTimer < 0) {
          this.delayTimer = 0;
        }
      }
    });
  }

  get type() {
    return this.constructor.name;
  }

  serialize() {
    return {
      type: this.type,
      delayTimer: this.delayTimer
    };
  }

  deserialize(obj) {
    const { delayTimer } = obj;
    if (delayTimer !== undefined) {
      this.delayTimer = delayTimer;
    }
  }

  cleanup() {
    if (this.removeHandler) {
      this.removeHandler();
    }
  }

  fireInternal(fx, fy, sourceHero) {
    if (this.delayTimer <= 0) {
      this.fire(fx, fy, sourceHero);
      this.delayTimer = this.delayAmount;
    }
  }

  fire(fx, fy, sourceHero) {
  }
}

export default Weapon;