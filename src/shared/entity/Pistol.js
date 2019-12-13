import Weapon from './Weapon';
import Vector from '../util/Vector';
import Projectile from './Projectile';
import WM from './WorldManager';
import AM from '../audio/AudioManager';
import GM from '../event/GameManager';

const BOUNCES = 1;

class Pistol extends Weapon {
  constructor() {
    super('Pistol');
    this.damage = 18;
  }

  fire(fx, fy, sourceHero) {

    const vector = new Vector(0, 0);

    // Create direction vector to target
    const { x, y } = sourceHero.position;
    vector.setXY(fx - x, fy - y);
    vector.normalize();

    const bullet = new Projectile(sourceHero.id);
    bullet.maxBounces = BOUNCES;
    bullet.velocity.set(vector);
    bullet.velocity.scale(650);


    bullet.registerHandler('HIT_OBJECT', event => {
      const { hitID, sourceID, projectileID } = event;
      if (projectileID === bullet.id) {
        const object = WM.findByID(hitID);
        if (object) {
          object.damage(this.damage, sourceID);
        }
      }
    });

    WM.add(bullet);

    // Position the bullet
    bullet.setPosition(sourceHero.position);
    vector.setXY(fx - x, fy - y);
    vector.normalize();
    vector.scale(30);
    bullet.addPosition(vector);
    AM.playSound('fire.wav', 0.125, sourceHero.position.clone());
  }

  renderTooltip() {
    return {
      ...super.renderTooltip(),
      'Bounces': BOUNCES
    };
  }
}

export default Pistol;