import Entity from './Entity';
import Weapon from './Weapon';
import Vector from '../util/Vector';
import Projectile from './Projectile';
import GM from '../event/GameManager';
import WM from './WorldManager';
import { isClient } from '../util/util';
import AM from '../audio/AudioManager';

class Pistol extends Weapon {
  constructor() {
    super();
  }

  fire(fx, fy, sourceHero) {

    const vector = new Vector(0, 0);
    const offset = new Vector(0, 0);

    // Create direction vector to target
    const { x, y } = sourceHero.position;
    vector.setXY(fx - x, fy - y);
    vector.normalize();

    vector.addXY(sourceHero.createOffset(0.1), sourceHero.createOffset(0.1));
    vector.normalize();

    const bullet = new Projectile(sourceHero.id);
    bullet.velocity.set(vector);

    offset.set(vector);
    offset.normalize();
    offset.scale(40);

    bullet.velocity.scale(650);
    bullet.setPosition(sourceHero.position);
    bullet.position.add(offset);
    bullet.registerHandler('HIT_OBJECT', event => {
      const { hitID, sourceID, projectileID } = event;
      if (projectileID === bullet.id) {
        const object = WM.findByID(hitID);
        if (object) {
          object.damage(1, sourceID);
        }
      }
    });
    WM.add(bullet);
    AM.playSound('fire.wav');
  }
}

export default Pistol;