import Entity from "./Entity";
import WM from "./WorldManager";
import Rectangle from "../util/Rectangle";
import Vector from "../util/Vector";
import GM from "../event/GameManager";
import { isServer, isClient, registerEntity } from "../util/util";
import Hero from './Hero';

class Ray extends Entity {
  constructor(sourceID = null) {
    super();
    this.sourceID = sourceID;
    this.doSynchronize = false;
    this.boundingBox = new Rectangle(0, 0, 10, 10);
    this.onHit = null;
    this.isSpectral = true;

    if (isServer()) {
      this.registerHandler('OBJECT_COLLISION', event => {
        const { object1, object2 } = event;
        let other = null;
        if (object1.id === this.id) {
          if (object2.id !== this.sourceID) {
            other = object2;
          }
        } else if (object2.id === this.id) {
          if (object1.id !== this.sourceID) {
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
        }
      });
    }
  }

  initializeGraphics(two) {
    // The ray has no graphics on its own
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

  castRay(target) {
    this.velocity.set(target);
    this.velocity.subtract(this.position);
    this.velocity.normalize();
    this.velocity.scale(40);

    this.position.add(this.velocity);

    const start = new Vector(0, 0);
    start.set(this.position);

    // Move this until it collides
    const ignore = this.sourceID ? [this.sourceID] : [];
    while (!WM.move(this, 0.1, ignore));
    this.markForDelete();

    const end = this.position;

    const event = {
      type: 'CREATE_RAY',
      data: {
        source: this.sourceID,
        start: {
          x: start.x,
          y: start.y
        },
        end: {
          x: end.x,
          y: end.y
        }
      }
    };
    GM.emitEvent(event);
  }

}

export default Ray;