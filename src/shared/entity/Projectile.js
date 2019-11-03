import Entity from './Entity';
import GM from '../event/GameManager';
import Rectangle from '../util/Rectangle';
import Explosion from './Explosion';
import WM from './WorldManager';
import { isClient, isServer } from '../util/util';
import Hero from '../entity/Hero';
import PickUp from './PickUp';

class Projectile extends Entity {
  constructor(sourceID = null) {
    super();
    this.sourceID = sourceID;
    this.boundingBox = new Rectangle(0, 0, 20, 20);
    this.bounce = 1;
    this.maxBounces = 0;
    this.bounces = 0;
    this.updatePosition();

    this.registerHandler('GEOMETRY_COLLISION', event => {
      const { object } = event;
      if (isServer() && object.id === this.id) {
        this.bounces += 1;
        if (this.bounces > this.maxBounces) {
          this.markForDelete();
        }
      }
    });

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
          const scale = ((other.damageAmount / other.maxDamage) * 0.8 + 0.2) * 200;
          this.velocity.normalize();
          this.velocity.scale(scale);
          other.applyForce(this.velocity);
        }
        if (!(other instanceof PickUp) && isServer()) {
          this.markForDelete();
        }
      }
    });
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