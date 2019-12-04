import Weapon from './Weapon';
import WM from './WorldManager';
import Vector from '../util/Vector';
import Projectile from './Projectile';
import AM from '../audio/AudioManager';
import { color } from '../util/util';

// Build the random spray pattern
const SPRAY_PATTERN = [];
for (let i = 0; i < 100; i++) {
  SPRAY_PATTERN.push({
    x: Math.random() - 0.5,
    y: Math.random() - 0.5
  });
}

const COLOR = color(200, 200, 80);

class Madsen extends Weapon {
  constructor() {
    super('Madsen', 0.2, true);
    this.sprayIndex = 0;
  }

  serialize() {
    return {
      ...super.serialize(),
      sprayIndex: this.sprayIndex
    };
  }

  deserialize(obj) {
    super.deserialize(obj);
    const { sprayIndex } = obj;
    if (sprayIndex !== undefined) {
      this.sprayIndex = sprayIndex;
    }
  }

  fire(fx, fy, sourceHero) {

    const vector = new Vector(0, 0);
    const offset = new Vector(0, 0);

    // Create direction vector to target
    const { x, y } = sourceHero.position;
    vector.setXY(fx - x, fy - y);
    vector.normalize();

    // Add pseudorandom spray value
    const so = this.getSprayOffset();
    vector.add(so, 0.25);
    vector.normalize();

    const bullet = new Projectile(sourceHero.id, COLOR);
    bullet.maxBounces = 0;
    bullet.velocity.set(vector);
    bullet.velocity.scale(750);

    bullet.registerHandler('HIT_OBJECT', event => {
      const { hitID, sourceID, projectileID } = event;
      if (projectileID === bullet.id) {
        const object = WM.findByID(hitID);
        if (object) {
          object.damage(10, sourceID);
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
    this.incrementSpray();
  }

  getSprayOffset() {
    return SPRAY_PATTERN[this.sprayIndex];
  }

  incrementSpray() {
    this.sprayIndex += 1;
    this.sprayIndex %= SPRAY_PATTERN.length;
  }
}

export default Madsen;