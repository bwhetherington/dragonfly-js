import Entity from './Entity';
import GM from '../event/GameManager';
import Rectangle from '../util/Rectangle';
import Explosion from './Explosion';
import WM from './WorldManager';
import { isClient } from '../util/util';
import AM from '../audio/AudioManager';

class Projectile extends Entity {
  constructor(sourceID = null) {
    super();
    this.sourceID = sourceID;
    this.boundingBox = new Rectangle(0, 0, 20, 20);
    this.updatePosition();

    if (!isClient()) {
      this.registerHandler('GEOMETRY_COLLISION', event => {
        const { object } = event;
        if (object.id === this.id) {
          this.markForDelete();
        }
      })

      this.registerHandler('OBJECT_COLLISION', event => {
        const { object1, object2 } = event;
        if (object1.id === this.id) {
          if (object2.id !== this.sourceID && !(object2 instanceof Projectile)) {
            this.hit(object2);
            this.velocity.scale(0.05);
            object2.applyForce(this.velocity);
            this.markForDelete();
          }
        } else if (object2.id === this.id) {
          if (object1.id !== this.sourceID && !(object1 instanceof Projectile)) {
            this.hit(object1);
            this.velocity.scale(0.05);
            object1.applyForce(this.velocity);
            this.markForDelete();
          }
        }
      });
    }

    AM.playSound('fire.wav', 0.1);
  }

  initializeGraphics(two) {
    const circle = two.makeCircle(this.position.x, this.position.y, 10);
    circle.fill = 'rgba(200, 150, 50, 0.8)';
    circle.stroke = 'rgba(150, 100, 25, 0.6)';
    circle.linewidth = 5;
    this.graphicsObject = circle;
  }

  hit(entity) {
    entity.damage(1);
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