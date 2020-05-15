import Vector from "../util/Vector";
// import uuid from 'uuid/v1';
import GM from "../event/GameManager";
import WM from "./WorldManager";
import Rectangle from "../util/Rectangle";
import { isClient, registerEntity, uuid, isServer } from "../util/util";
import NM from "../network/NetworkManager";
import { color, getStroke, getFill, getBrighter } from "../util/color";
import Projectile from "./Projectile";
import { CollisionGroup } from "./util";

class Entity {
  constructor() {
    this.type = "Entity";
    this.position = new Vector(0, 0);
    this.velocity = new Vector(0, 0);
    this.acceleration = new Vector(0, 0);
    this.vectorBuffer1 = new Vector(0, 0);
    this.vectorBuffer2 = new Vector(0, 0);
    this.graphicsObject = null;
    this.markedForDelete = false;
    this.setBounds(new Rectangle(0, 0, 30, 30));
    this.handlers = {};
    this.setID(uuid());
    this.doSynchronize = true;
    this.isCollidable = true;
    this.movementSpeed = 0;
    this.isSlow = false;
    this.friction = 0;
    this.bounce = 0.5;
    this.isSpectral = false;
    this.hasMoved = true;
    this.syncMove = true;
    this.hasSpawned = false;
    this.opacity = 1;
    this.isActive = true;
    this.canDelete = false;
    this.setColor(color(50, 50, 50));
    this.predictionAdjustment = 0;
    this.timers = {};
    this.flashDuration = 0;
    this.collisionGroup = CollisionGroup.ENTITY;
  }

  fireAnimation() {}

  setBounds(shape) {
    this.boundingBox = shape;
    shape.setCenter(this);
    shape.parent = this.id;
  }

  registerHandler(type, handler) {
    const id = GM.registerHandler(type, handler);
    this.handlers[id] = type;
  }

  /**
   * Disables an entity, hiding it and removing its collision. This does not
   * remove the entity.
   */
  disable() {
    if (this.canDelete) {
      this.markForDelete();
    } else {
      this.doSynchronize = false;
      this.isActive = false;
      this.updateOpacity(0);
      this.isCollidable = false;
    }
  }

  setGraphicsObjectColor(color) {
    const { colorObject, graphicsObject } = this;
    const obj = colorObject || graphicsObject;
    if (obj) {
      const fill = getFill(color);
      const stroke = getStroke(color);
      obj.fill = fill;
      obj.stroke = stroke;
    }
  }

  setColor(color) {
    this.color = color;
    this.flashColor = getBrighter(color, 2);
    this.setGraphicsObjectColor(color);
  }

  applyForce(vector) {
    this.velocity.add(vector);
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

  addPosition(vector, scalar = 1) {
    this.position.add(vector, scalar);
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

  predictMovement(dt) {
    this.predictionAdjustment = dt;
  }

  step(step, dt) {
    // WM.move(this, dt + this.predictionAdjustment);
    this.predictionAdjustment = 0;

    if (this.graphicsObject || this.colorObject) {
      const wasZero = this.flashDuration === 0;
      this.flashDuration = Math.max(0, this.flashDuration - dt);
      if (this.flashDuration === 0 && !wasZero) {
        this.setColor(this.color);
      }
    }
  }

  markForDelete() {
    this.markedForDelete = true;
    const event = {
      type: "MARK_FOR_DELETE",
      data: {
        id: this.id,
      },
    };
    GM.emitEvent(event);
  }

  cleanup() {
    if (this.graphicsObject) {
      const event = {
        type: "CLEANUP_GRAPHICS",
        data: {
          layer: this.collisionGroup,
          object: this.graphicsObject,
        },
      };
      GM.emitEvent(event);
    }

    // Cleanup handlers attached to this entity
    for (const handlerID in this.handlers) {
      const type = this.handlers[handlerID];
      this.removeHandler(type, handlerID);
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
      syncMove: this.syncMove,
      timers: this.timers,
    };
  }

  setID(id) {
    this.id = id;
    if (this.boundingBox) {
      this.boundingBox.parent = id;
    }
  }

  deserialize(obj) {
    if (this.doSynchronize) {
      const {
        position,
        velocity,
        acceleration,
        isCollidable,
        isSpectral,
        opacity,
        syncMove,
        bounce,
        timers,
      } = obj;
      if (syncMove !== undefined) {
        this.syncMove = syncMove;
      }
      if (position) {
        this.position.deserialize(position);
      }
      if (velocity) {
        this.velocity.deserialize(velocity);
      }
      if (acceleration) {
        this.acceleration.deserialize(acceleration);
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
      if (bounce !== undefined) {
        this.bounce = bounce;
      }
      if (timers) {
        for (const timerID in timers) {
          this.timers[timerID] = timers[timerID];
        }
      }
      this.hasSpawned = true;
      return true;
    } else {
      return false;
    }
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
    if (this.graphicsObject) {
      const layer = WM.graphicsLayers[this.collisionGroup];
      layer.add(this.graphicsObject);
      this.setColor(this.color);
    }
    this.updateOpacity(this.opacity);
  }

  initializeGraphics(two) {
    const object = two.makeRectangle(this.position.x, this.position.y, 30, 30);
    object.linewidth = 5;
    this.graphicsObject = object;
    if (this.graphicsObject) {
      this.graphicsObject.opacity = this.opacity;
    }
  }

  flash() {
    if (this.graphicsObject) {
      this.flashDuration = 0.1;
      this.setGraphicsObjectColor(this.flashColor);
    }
  }

  damage(amount, sourceID) {
    if (isServer()) {
      const event = {
        type: "ENTITY_DAMAGED",
        data: {
          damagedID: this.id,
          sourceID: sourceID,
          amount,
        },
      };
      GM.emitEvent(event);
      NM.send(event);
    }
  }

  runInterval(interval, callback) {
    const handlerID = this.registerHandler("STEP", (event, _, id) => {
      const { dt } = event;
      this.timers[id] = (this.timers[id] || 0) + dt;

      // Check time
      if (this.timers[id] >= interval) {
        this.timers[id] -= interval;
        callback();
      }
    });
    this.timers[handlerID] = 0;
  }

  removeHandler(type, id) {
    GM.removeHandler(type, id);
    delete this.handlers[id];
  }

  runDelay(delay, callback) {
    const handlerID = this.registerHandler("STEP", (event, remove, id) => {
      const { dt } = event;
      this.timers[id] = (this.timers[id] || 0) + dt;

      // Check time
      if (this.timers[id] >= delay) {
        callback();
        this.removeHandler("STEP", id);
        delete this.timers[id];
      }
    });
    this.timers[handlerID] = 0;
  }

  getDebugName() {
    return `${this.type}<${this.id}>`;
  }
}

export default Entity;
