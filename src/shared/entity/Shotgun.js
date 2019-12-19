import Weapon from './Weapon';
import Vector from '../util/Vector';
import Projectile from './Projectile';
import GM from '../event/GameManager';
import WM from './WorldManager';
import AM from '../audio/AudioManager';

class Shotgun extends Weapon {
  constructor() {
    super("Shotgun", 0.75);
    this.projectileNum = 5;
    this.spread = Math.PI / 4;
    this.damage = 10;
  }

  fire(fx, fy, sourceHero) {
    const vector = new Vector(0, 0);
    const offset = new Vector(0, 0);

    // Create direction vector to target
    const { x, y } = sourceHero.position;

    vector.setXY(fx - x, fy - y);
    const baseAngle = vector.angle;
    const spread = this.spread / this.projectileNum;

    for (let i = 0; i < this.projectileNum; i++) {
      const bullet = new Projectile(sourceHero.id);
      bullet.bounce = 0;
      bullet.maxBounces = 0;

      const velocity = Vector.fromPolar(1, (i - (this.projectileNum - 1) / 2) * spread + baseAngle);
      // velocity.addXY(sourceHero.createOffset(0.1), sourceHero.createOffset(0.1));
      // velocity.normalize();
      velocity.scale(750);

      bullet.velocity.set(velocity);

      offset.set(vector);
      offset.normalize();
      offset.scale(30);

      bullet.setPosition(sourceHero.position);
      bullet.position.add(offset);
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
    }
    AM.playSound('fire.wav', 0.125, sourceHero.position.clone());
  }

  renderTooltip() {
    return {
      ...super.renderTooltip(),
      'Shots': this.projectileNum
    };
  }
}

export default Shotgun;