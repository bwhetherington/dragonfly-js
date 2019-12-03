import Weapon from './Weapon';
import WM from './WorldManager';
import AM from '../audio/AudioManager';
import Ray from './Ray';

class Raygun extends Weapon {
  constructor() {
    super("Raygun", 1);
    this.useTimeWarp = true;
  }

  fire(fx, fy, sourceHero) {
    AM.playSound('fire.wav', 0.125, sourceHero.position.clone());
    const ray = new Ray(sourceHero.id);
    WM.add(ray);
    ray.position.set(sourceHero.position);
    ray.castRay({ x: fx, y: fy });
    ray.registerHandler('HIT_OBJECT', event => {
      const { hitID, sourceID, projectileID } = event;
      if (projectileID === ray.id) {
        const object = WM.findByID(hitID);
        if (object) {
          object.damage(25, sourceID);
        }
      }
    });
  }
}

export default Raygun;