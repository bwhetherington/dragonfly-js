import Entity from './Entity';
import GM from '../event/GameManager';
import WM from './WorldManager';
import Rectangle from '../util/Rectangle';
import Explosion from './Explosion';
import { isClient, isServer, registerEntity, color } from '../util/util';
import Hero from '../entity/Hero';
import PickUp from './PickUp';

const DEFAULT_COLOR = color(200, 150, 50);

class Projectile extends Entity {
  constructor(sourceID = null, color = DEFAULT_COLOR, explosionRadius = 30) {
    super();
    this.explosionRadius = explosionRadius;
    this.sourceID = sourceID;
    this.boundingBox = new Rectangle(0, 0, 20, 20);
    this.bounce = 0;
    this.maxBounces = 0;
    this.bounces = 0;
    this.isSpectral = true;
    this.syncMove = false;
    this.color = color;
    this.isFirstSync = true;
    this.updatePosition();

    // if (isServer()) {
    this.registerHandler('GEOMETRY_COLLISION', event => {
      const { object } = event;
      if (object.id === this.id) {
        this.bounces += 1;
        if (this.bounces > this.maxBounces) {
          this.hit(null);
          this.end();
        }
      }
    });

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
        this.end();
      }
    });
    // }
  }

  end() {
    if (isServer()) {
      this.markForDelete();
    } else {
      this.disable();

      // Spawn explosion
      const explosion = new Explosion(this.color, this.explosionRadius);
      explosion.setPosition(this.position);
      WM.add(explosion);
    }
  }

  initializeGraphics(two) {
    const circle = two.makeCircle(this.position.x, this.position.y, 10);
    circle.linewidth = 5;
    this.graphicsObject = circle;
    this.setColor(this.color);
    this.graphicsObject.opacity = 0.7;
  }

  hit(entity) {
    if (entity instanceof Hero && !entity.isInvincible) {
      const scale = ((entity.damageAmount / entity.maxDamage) * 0.8 + 0.2) * 200;
      this.velocity.normalize();
      this.velocity.scale(scale);
      entity.applyForce(this.velocity);
    }
    const event = {
      type: 'HIT_OBJECT',
      data: {
        sourceID: this.sourceID,
        projectileID: this.id,
        hitID: entity ? entity.id : null
      }
    };
    GM.emitEvent(event);
  }

  serialize() {
    return {
      ...super.serialize(),
      sourceID: this.sourceID,
      explosionRadius: this.explosionRadius,
      color: this.color,
      bounces: this.bounces,
      maxBounces: this.maxBounces
    };
  }

  deserialize(object) {
    if (super.deserialize(object)) {
      // Only synchronize once
      this.doSynchronize = false;

      const { color, sourceID, explosionRadius, bounces, maxBounces } = object;
      if (sourceID) {
        this.sourceID = sourceID;
      }
      if (color) {
        this.color = color;
      }
      if (explosionRadius !== undefined) {
        this.explosionRadius = explosionRadius;
      }
      if (bounces !== undefined) {
        this.bounces = bounces;
      }
      if (maxBounces !== undefined) {
        this.maxBounces = maxBounces;
      }
      return true;
    } else {
      return false;
    }
  }

}

registerEntity(Projectile);

export default Projectile;