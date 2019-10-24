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

    if (isServer()) {
      this.registerHandler('STEP', data => {
        this.timer += data.dt;
        if (this.timer >= 1) {
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
          if (other instanceof Hero) {
            const scale = Math.max(other.damageAmount, 10) * 0.05;
            this.velocity.scale(scale);
            other.applyForce(this.velocity);
          }
          if (!(other instanceof PickUp)) {
            this.markForDelete();
          }
        }
      });
    }

    //as AM.playSoundInternal('fire.wav', 0.1);
  }

  initializeGraphics(two) {
    const circle = two.makeCircle(this.position.x, this.position.y, 10);
    circle.fill = 'rgba(200, 150, 50, 0.8)';
    circle.stroke = 'rgba(150, 100, 25, 0.6)';
    circle.linewidth = 5;
    this.graphicsObject = circle;
  }

  hit(entity) {
    entity.damage(1, this.sourceID);
    const event = {
      type: 'OBJECT_HIT',
      data: {
        object: entity,
        sourceID: this.sourceID
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