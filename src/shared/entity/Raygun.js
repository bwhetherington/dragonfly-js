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
    super(1);
  }

  fire(fx, fy, sourceHero) {
    AM.playSound('fire.wav');
    const ray = new Ray(sourceHero.id);
    WM.add(ray);
    ray.position.set(sourceHero.position);
    ray.castRay({ x: fx, y: fy });
    ray.registerHandler('HIT_OBJECT', event => {
      const { hitID, sourceID, projectileID } = event;
      if (projectileID === ray.id) {
        const object = WM.findByID(hitID);
        if (object) {
          object.damage(10, sourceID);
        }
      }
    });
  }
}

export default Raygun;