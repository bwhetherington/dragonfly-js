import Entity from './Entity';
import Rocket from './Rocket';
import { iterator } from 'lazy-iters';
import WM from './WorldManager';
import Hero from './Hero';
import { registerEntity, isServer, isClient } from '../util/util';
import Madsen from './Madsen';
import Explosion from './Explosion';
import Vector from '../util/Vector';
import GM from '../event/GameManager';

const SPAWNER = {
  count: 0,
  spawnPoints: [new Vector(0, 0)]
};

class Enemy extends Entity {

  static initializeSpawnPoints(count) {
    const points = [];
    for (let i = 0; i < count; i++) {
      const point = WM.getRandomPoint(40, 40);
      points.push(point);
    }
    SPAWNER.spawnPoints = points;
  }

  constructor() {
    super();
    this.cannonAngle = 0;
    this.friction = 1;
    this.damageAmount = 0;
    this.maxDamage = 100;
    this.name = 'Enemy';
    this.setPositionXY(0, 0);
    this.weapon = new Madsen();
    this.weapon.delayAmount = 1;
    this.doSynchronize = true;
    this.target = new Vector(0, 0);
    this.lastPosition = new Vector(0, 0);
    this.timer = 0;

    this.setColor({
      red: 75,
      green: 75,
      blue: 75
    });

    if (isServer()) {
      this.registerHandler('STEP', event => {
        this.onStep(event.dt);
      });
    }

    this.registerHandler('GEOMETRY_COLLISION', event => {
      const { object } = event;
      if (object.id === this.id) {
        this.target.set(WM.getRandomPoint());
      }
    });

    this.registerHandler('OBJECT_COLLISION', event => {
      const { object1, object2 } = event;
      let other = null;
      if (object1.id === this.id) {
        if (object2 instanceof Hero || object2 instanceof Enemy) {
          other = object2;
        }
      }
      if (object2.id === this.id) {
        if (object1 instanceof Hero || object1 instanceof Enemy) {
          other = object1;
        }
      }
      if (other !== null) {
        const vector = new Vector(0, 0);
        vector.add(other.position);
        vector.subtract(this.position);
        vector.normalize();
        vector.scale(2);
        other.applyForce(vector);
      }
    });
  }

  kill() {

  }

  damage(amount, sourceID) {
    this.damageAmount += amount;
    if (this.damageAmount >= this.maxDamage) {
      this.markForDelete();
      // const event = {
      //   type: 'PLAYER_KILLED',
      //   data: {
      //     deadID: this.id,
      //     killerID: sourceID
      //   }
      // };
      // GM.emitEvent(event);
    }
  }

  getTargetHero() {
    const { targetHero } = this;
    if (targetHero) {
      return WM.findByID(targetHero);
    } else {
      return null;
    }
  }

  selectTargetHero() {
    const [hero] = iterator(WM.getEntities())
      .filter(entity => entity.id !== this.id)
      .filter(entity => entity instanceof Hero || entity instanceof Enemy)
      .map(entity => [entity, entity.position.distance(this.position)])
      .fold([null, Infinity], ([closest, dist], [cur, newDist]) => {
        if (newDist < dist) {
          return [cur, newDist];
        } else {
          return [closest, dist];
        }
      });
    this.targetHero = hero.id;
  }

  onStep(dt) {
    // Handle timer
    this.timer += dt;
    if (this.timer >= 2) {
      this.timer -= 2;
      this.selectTargetHero();
    }

    // Look for nearest hero
    this.weapon.step(dt);

    const hero = this.getTargetHero();

    if (hero) {
      const angle = this.position.angleTo(hero.position);
      this.rotateCannon(angle);
      this.weapon.fireInternal(hero.position.x, hero.position.y, this);
    }

    // Handle movement
    if (this.target.distance(this.position) > 100) {
      // Move to target
      this.acceleration.setXY(0, 0);
      this.acceleration.set(this.target);
      this.acceleration.subtract(this.position);
      this.acceleration.normalize();
      this.acceleration.scale(200);
    } else {
      // Get new target
      this.target.set(WM.getRandomPoint());
    }

    // Check if we're stuck
    if (this.position.distance(this.lastPosition) < 1) {
      this.target.set(WM.getRandomPoint());
    }
    this.lastPosition.set(this.position);
  }

  serialize() {
    return {
      ...super.serialize(),
      damageAmount: this.damageAmount,
      cannonAngle: this.cannonAngle,
      targetHero: this.targetHero,
      timer: this.timer
    };
  }

  deserialize(obj) {
    if (super.deserialize(obj)) {
      const { cannonAngle, damageAmount, targetHero, timer } = obj;
      if (cannonAngle !== undefined) {
        this.rotateCannon(cannonAngle + Math.PI / 2);
      }
      if (damageAmount !== undefined) {
        this.damageAmount = damageAmount;
        if (this.damageAmount >= this.maxDamage) {
          this.markForDelete();
        }
      }
      if (timer !== undefined) {
        this.timer = timer;
      }
      if (targetHero) {
        this.targetHero = targetHero;
      }
      return true;
    } else {
      return false;
    }
  }

  rotateCannon(angle) {
    this.cannonAngle = angle;

    // Calculate cannon tip
    this.vectorBuffer2.setXY(Math.cos(angle - Math.PI / 2), Math.sin(angle - Math.PI / 2));
    this.vectorBuffer2.scale(30);

    if (this.cannon) {
      this.cannon.rotation = angle;
    }
  }

  initializeGraphics(two) {
    const object = two.makeRectangle(0, 0, 30, 30);
    object.linewidth = 5;
    this.tankBody = object;

    const cannon = two.makeRectangle(0, -10, 10, 30);
    cannon.linewidth = 5;
    const cannonGroup = two.makeGroup(cannon);
    cannonGroup.rotation = 1;
    // cannonGroup.translation.set(this.position.x, this.position.y);
    this.cannon = cannonGroup;

    this.graphicsObject = two.makeGroup(object, cannonGroup)
    this.graphicsObject.translation.set(this.position.x, this.position.y);

    // Select color
    // const color = COLORS_LIST[this.playerID % COLORS_LIST.length];
    // this.setColor(color);
    // if (this.graphicsObject) {
    //   this.graphicsObject.opacity = this.opacity;
    // }
  }

  cleanup() {
    super.cleanup();
    if (isClient()) {
      const explosion = new Explosion(this.color, 50);
      explosion.setPosition(this.position);
      WM.add(explosion);
    }
  }
}

export default Enemy;