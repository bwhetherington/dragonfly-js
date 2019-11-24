import GM from '../event/GameManager';

class Weapon {
  constructor(name = "Weapon", delayAmount = 0.5) {
    this.delayTimer = 0;
    this.delayAmount = delayAmount;
    this.removeHandler = null;
    this.name = name;

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
      delayTimer: this.delayTimer,
      delayAmount: this.delayAmount
    };
  }

  deserialize(obj) {
    const { delayTimer, delayAmount } = obj;
    if (delayTimer !== undefined) {
      this.delayTimer = delayTimer;
    }
    if (delayAmount !== undefined) {
      this.delayAmount = delayAmount;
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