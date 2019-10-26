import Entity from './Entity';
import GM from '../event/GameManager';
import Rectangle from '../util/Rectangle';
import Explosion from './Explosion';
import WM from './WorldManager';
import { isClient, isServer } from '../util/util';
import AM from '../audio/AudioManager';
import Hero from '../entity/Hero';
import PickUp from './PickUp';

class Projectile extends Entity {
  constructor(sourceID = null) {
    super();
    this.sourceID = sourceID;
    this.boundingBox = new Rectangle(0, 0, 20, 20);
    this.bounce = 1;
    this.timer = 0;
    this.updatePosition();

    this.registerHandler('STEP', data => {
      this.timer += data.dt;
      if (this.timer >= 1 && isServer()) {
        this.markForDelete();
      }
    });
    // this.registerHandler('GEOMETRY_COLLISION', event => {
    //   const { object } = event;
    //   if (object.id === this.id) {
    //     this.bounces += 1;
    //     if (this.bounces = 1000) {
    //       this.markForDelete();
    //     }
    //   }
    // });

    this.registerHandler('OBJECT_COLLISION', event => {
      const { object1, object2 } = event;
      let other = null;
      if (object1.id === this.id) {
        if (object2.id !== this.sourceID && !(object2 instanceof Projectile)) {
          other = object2;
        }
      } else if (object2.id === this.id) {
        if (object1.id !== this.sourceID && !(object1 instanceof Projectile)) {
          other = object1;
        }
      }
      if (other !== null) {
        this.hit(other);
        if (other instanceof Hero && !other.isInvincible) {
          const scale = Math.max(other.damageAmount, 10) * 10;
          this.velocity.normalize();
          this.velocity.scale(scale);
          other.applyForce(this.velocity);
        }
        if (!(other instanceof PickUp) && isServer()) { 
          this.markForDelete();
        }
      }
    });

    //as AM.playSoundInternal('fire.wav', 0.1);
  }

  initializeGraphics(two) {
    const circle = two.makeCircle(this.position.x, this.position.y, 10);
    circle.linewidth = 5;
    this.graphicsObject = circle;
    this.setColor({ red: 200, green: 150, blue: 50 });
    this.graphicsObject.opacity = 0.7;
  }

  hit(entity) {
    const event = {
      type: 'HIT_OBJECT',
      data: {
        sourceID: this.sourceID,
        projectileID: this.id,
        hitID: entity.id
      }
    };
    GM.emitEvent(event);
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
    if (isClient()) {
      const explosion = new Explosion();
      explosion.setPosition(this.position);
      WM.add(explosion);
    }
    super.cleanup();
  }
}

export default Projectile;