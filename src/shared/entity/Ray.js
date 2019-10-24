import Entity from "./Entity";
import WM from "./WorldManager";
import Rectangle from "../util/Rectangle";
import Vector from "../util/Vector";
import GM from "../event/GameManager";
import { isServer, isClient } from "../util/util";
import Hero from './Hero';

class Ray extends Entity {
  constructor(sourceID = null) {
    super();
    this.sourceID = sourceID;
    this.doSynchronize = false;
    this.boundingBox = new Rectangle(0, 0, 10, 10);
    this.onHit = null;

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
          if (other instanceof Hero) {
            const scale = Math.max(other.damageAmount, 10) * 10;
            this.velocity.normalize();
            this.velocity.scale(scale);
            other.applyForce(this.velocity);
          }
        }
      });
    }
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
    while (!WM.move(this, 0.1));
    this.markForDelete();

    const end = this.position;

    const event = {
      type: 'CREATE_RAY',
      data: {
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