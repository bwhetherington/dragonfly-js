import Vector from '../util/Vector';
import uuid from 'uuid/v1';
import GM from '../event/GameManager';
import WM from './WorldManager';
import Rectangle from '../util/Rectangle';
import { isClient, registerEntity } from '../util/util';

const getFill = color => {
  const { red, green, blue, alpha = 1 } = color;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const getStroke = color => {
  let { red, green, blue, alpha = 1 } = color;
  red -= 50;
  green -= 50;
  blue -= 50;
  return `rgb(${Math.max(0, red)}, ${Math.max(0, green)}, ${Math.max(0, blue)}, ${alpha})`;
}

class Entity {
  constructor() {
    this.position = new Vector(0, 0);
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
    this.vectorBuffer1 = new Vector(0, 0);
    this.vectorBuffer2 = new Vector(0, 0);
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
    this.friction = 0;
    this.bounce = 0;
    this.isSpectral = false;
    this.hasMoved = true;
    this.syncMove = true;
    this.hasSpawned = false;
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

  setColor(color) {
    const { colorObject, graphicsObject } = this;
    const obj = colorObject || graphicsObject;
    if (obj) {
      const fill = getFill(color);
      const stroke = getStroke(color);
      obj.fill = fill;
      obj.stroke = stroke;
    }
  }

  get type() {
    return this.constructor.name;
  }

  applyForce(vector) {
    this.velocity.add(vector);
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
  }

  markForDelete() {
    this.markedForDelete = true;
    const event = {
      type: 'MARK_FOR_DELETE',
      data: {
        id: this.id
      }
    };
    GM.emitEvent(event);
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
      position: this.position.serialize(),
      velocity: this.velocity.serialize(),
      acceleration: this.acceleration.serialize(),
      isCollidable: this.isCollidable,
      isSpectral: this.isSpectral,
      opacity: this.opacity,
      syncMove: this.syncMove
    };
  }

  deserialize(obj) {
    const { position, velocity, acceleration, isCollidable, isSpectral, opacity, syncMove } = obj;
    if (syncMove !== undefined) {
      this.syncMove = syncMove;
    }
    if ((this.syncMove || !this.hasSpawned) && position) {
      this.position.set(position);
    }
    if (velocity) {
      this.velocity.set(velocity);
    }
    if (acceleration) {
      this.acceleration.set(acceleration);
    }
    if (isCollidable !== undefined) {
      this.isCollidable = isCollidable;
    }
    if (isSpectral !== undefined) {
      this.isSpectral = isSpectral;
    }
    if (opacity !== undefined && opacity !== this.opacity) {
      this.updateOpacity(opacity);
    }
    this.hasSpawned = true;
  }

  updateOpacity(opacity) {
    this.opacity = opacity;
    const { graphicsObject } = this;
    if (graphicsObject) {
      graphicsObject.opacity = this.opacity;
    }
  }

  initializeGraphicsInternal(two) {
    if (this.graphicsObject) {
      two.remove(this.graphicsObject);
    }
    this.initializeGraphics(two);
  }

  initializeGraphics(two) {
    const object = two.makeRectangle(this.position.x, this.position.y, 30, 30);
    object.linewidth = 5;
    this.graphicsObject = object;
  }

  damage(amount) { }
}

registerEntity(Entity);

export default Entity;