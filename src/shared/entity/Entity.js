import Vector from '../util/Vector';
import uuid from 'uuid/v1';
import GM from '../event/GameManager';

class Entity {
  constructor() {
    this.position = new Vector(0, 0);
    this.velocity = new Vector(0, 0);
    this.velocityBuffer = new Vector(0, 0);
    this.graphicsObject = null;
    this.markedForDelete = false;
    this.id = uuid();
  }

  get type() {
    return this.constructor.name;
  }

  setID(id) {
    this.id = id;
  }

  getID() {
    return this.id;
  }

  step(step, dt) {
    this.velocityBuffer.set(this.velocity);
    this.velocityBuffer.scale(dt);
    this.position.add(this.velocityBuffer);
    this.updateGraphics();
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

  initializeGraphics(two) {
    const object = two.makeRectangle(0, 0, 30, 30);
    object.fill = '#FF8000';
    object.stroke = 'orangered'; // Accepts all valid css color
    object.linewidth = 5;
    this.graphicsObject = object;
  }

  updateGraphics() {
    const { graphicsObject } = this;
    if (graphicsObject) {
      graphicsObject.translation.set(this.position.x, this.position.y);
    }
  }
}

export default Entity;