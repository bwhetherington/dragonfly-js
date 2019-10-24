import Entity from './Entity';
import Weapon from './Weapon';
import Vector from '../util/Vector';
import Projectile from './Projectile';
import GM from '../event/GameManager';
import WM from './WorldManager';
import { isClient } from '../util/util';
import AM from '../audio/AudioManager';

class Shotgun extends Weapon {
  constructor() {
    super();
    this.projectileNum = 5;
    this.delayTimer = 0;
    this.delayAmount = 0.5;

    this.registerHandler('STEP', event => {
      const { dt } = event;
      if (this.delayTimer !== 0) {
        this.delayTimer -= dt;
        if (this.delayTimer < 0) {
          this.delayTimer = 0;
        }
      }
    });
  }

  fire(fx, fy, sourceHero) {
    if(this.delayTimer > 0){
      return;
    }
    super.fire(fx, fy, sourceHero);
    const vector = new Vector(0, 0);
    const offset = new Vector(0, 0);

    // Create direction vector to target
    const { x, y } = sourceHero.position;

    for (let i = 0; i < this.projectileNum; i++) {
      vector.setXY(fx - x, fy - y);
      vector.normalize();

      vector.addXY(sourceHero.createOffset(0.5), sourceHero.createOffset(0.5));
      vector.normalize();

      const bullet = new Projectile(sourceHero.id);
      bullet.velocity.set(vector);

      offset.set(vector);
      offset.normalize();
      offset.scale(20);

      bullet.velocity.scale(650);
      bullet.setPosition(sourceHero.position);
      bullet.position.add(offset);
      WM.add(bullet);
    }
    this.delayTimer = this.delayAmount;
    //AM.playSoundInternal('fire.wav');
    AM.playSound('fire.wav');
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

  cleanup() {
    super.cleanup();
  }
}

export default Shotgun;