import Entity from './Entity';
import Weapon from './Weapon';
import Vector from '../util/Vector';
import Projectile from './Projectile';
import GM from '../event/GameManager';
import WM from './WorldManager';
import { isClient } from '../util/util';
import AM from '../audio/AudioManager';
import Ray from './Ray';

class Raygun extends Weapon {
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
    AM.playSound('fire.wav');
    const ray = new Ray(sourceHero.id);
    WM.add(ray);
    ray.position.set(sourceHero.position);
    const event = {
      type: 'CAST_RAY',
      data: {
        id: ray.id,
        target: {
          x: fx,
          y: fy
        }
      }
    }
    GM.emitEvent(event);
    this.delayTimer = this.delayAmount;
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

export default Raygun;