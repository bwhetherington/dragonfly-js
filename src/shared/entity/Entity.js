import Vector from '../util/Vector';
import uuid from 'uuid/v1';
import GM from '../event/GameManager';
import WM from './WorldManager';
import Rectangle from '../util/Rectangle';

class Entity {
  constructor() {
    this.position = new Vector(0, 0);
    this.velocity = new Vector(0, 0);
    this.force = new Vector(0, 0);
    this.vectorBuffer = new Vector(0, 0);
    this.graphicsObject = null;
    this.markedForDelete = false;
    this.boundingBox = new Rectangle(0, 0, 30, 30);
    this.boundingBox.setCenter(this.position);
    this.handlers = {};
    this.id = uuid();
    this.doSynchronize = true;
    this.isCollidable = true;
    this.movementSpeed = 0;
    this.isSlow = false;
  }

  registerHandler(type, handler) {
    const id = GM.registerHandler(type, handler);
    let handlers = this.handlers[type];
    if (!handlers) {
      handlers = [];
      this.handlers[type] = handlers;
    }
    handlers.push(id);
  }

  get type() {
    return this.constructor.name;
  }

  applyForce(vector) {
    this.force.add(vector);
  }

  setID(id) {
    this.id = id;
  }

  getID() {
    return this.id;
  }

  updatePosition() {
    this.boundingBox.setCenter(this.position);
    if (this.graphicsObject) {
      this.graphicsObject.translation.set(this.position.x, this.position.y);
    }
  }

  addPosition(vector) {
    this.position.add(vector);
    this.updatePosition();
  }

  addPositionXY(x, y) {
    this.position.addXY(x, y);
    this.updatePosition();
  }

  setPositionXY(x, y) {
    this.position.setXY(x, y);
    this.updatePosition();
  }

  setPosition(vector) {
    this.position.set(vector);
    this.updatePosition();
  }

  step(step, dt) {
    WM.move(this, dt);
    this.force.decay(dt * 200);
  }

  markForDelete() {
    this.markedForDelete = true;
  }

  cleanup() {
    if (this.graphicsObject) {
      const event = {
        type: 'CLEANUP_GRAPHICS',
        data: {
          object: this.graphicsObject
        }
      };
      GM.emitEvent(event);
    }

    // Cleanup handlers attached to this entity
    for (const type in this.handlers) {
      const handlers = this.handlers[type];
      for (const id of handlers) {
        GM.removeHandler(type, id);
      }
    }
  }

  serialize() {
    return {
      type: this.type,
      id: this.id,
      position: this.position,
      velocity: this.velocity
    };
  }

  deserialize(obj) {
    const { position, velocity } = obj;
    if (position) {
      this.position.set(position);
    }
    if (velocity) {
      this.velocity.set(velocity);
    }
  }

  updateColor() {
    const { graphicsObject } = this;
    if (graphicsObject) {
      const { damageAmount = 0 } = this;
      const damageColor = Math.min(100 + damageAmount * 5, 255);
      const outlineColor = damageColor - 50;
      graphicsObject.fill = `rgb(${damageColor}, 75, 50)`;
      graphicsObject.stroke = `rgb(${outlineColor}, 50, 25)`;
    }
  }

  initializeGraphics(two) {
    const object = two.makeRectangle(this.position.x, this.position.y, 30, 30);
    object.linewidth = 5;
    this.graphicsObject = object;
    this.updateColor();
  }

  damage(amount) { }
}

export default Entity;