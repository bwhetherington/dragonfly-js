import GM from '../event/GameManager';
import { diff, sizeOf } from '../util/util';
import Rectangle from '../util/Rectangle';
import InverseRectangle from '../util/InverseRectangle';
import Projectile from '../entity/Projectile';
import { Vector } from 'twojs-ts';
import Hero from './Hero';
import SizedQueue from '../util/SizedQueue';
import NM from '../network/NetworkManager';

class WorldManager {
  constructor() {
    this.entities = {};
    this.entityCount = 0;
    this.deleted = [];
    this.entityGenerator = () => null;
    this.setBounds(0, 0, 500, 500);
    this.geometry = {};
    this.friction = 5;
    this.background = null;
    this.foreground = null;
    this.previousState = [];
    this.entityTable = {};
    this.previousStates = new SizedQueue(600);
  }

  registerEntity(EntityType) {
    this.entityTable[EntityType.name] = EntityType;
  }

  *getEntities() {
    for (const id in this.entities) {
      yield this.entities[id];
    }
  }

  *getEntitiesByRadius(point, radius) {
    for (const entity of this.getEntities()) {
      if (entity.isCollidable) {
        if (entity.position.distance(point) <= radius) {
          yield entity;
        }
      }
    }
  }

  initializeGraphics(two) {
    for (const id in this.entities) {
      this.entities[id].initializeGraphicsInternal(two);
    }
  }

  setEntityGenerator(generator) {
    this.entityGenerator = generator;
  }

  setGeomtetry(geometry) {
    this.geometry = geometry.map(({ type, x, y, width, height }) => {
      switch (type) {
        case 'Rectangle':
          return new Rectangle(x, y, width, height);
        case 'InverseRectangle':
          this.setBounds(x - width / 2, y - height / 2, width, height);
          return new InverseRectangle(x, y, width, height);
        default:
          return null;
      }
    }).filter(shape => shape !== null);
  }

  getRandomPoint() {
    const { x, y, width, height } = this.bounds;

    let rx, ry, notFound = true;

    // If there are no valid spots, this will hang
    while (notFound) {
      rx = Math.random() * width + x;
      ry = Math.random() * height + y;
      notFound = false;
      for (const shape of this.geometry) {
        if (shape.containsPoint(rx, ry)) {
          notFound = true;
          break;
        }
      }
    }
    return new Vector(rx, ry);
  }

  initialize() {
    GM.registerHandler('STEP', ({ step, dt }) => {
      this.step(step, dt);

      // Save this step
      const objects = [];
      for (const object of this.getEntities()) {
        objects.push(object.serialize());
      }

      // Store state for rollback
      const state = {
        time: GM.timeElapsed,
        state: objects
      };
      this.previousStates.enqueue(state);
    });
  }

  findByID(id) {
    return this.entities[id] || null;
  }

  add(entity) {
    this.entities[entity.id] = entity;
    this.entityCount += 1;

    const event = {
      type: 'CREATE_OBJECT',
      data: {
        object: entity
      }
    };

    GM.emitEvent(event);
  }

  deleteEntities() {

  }

  step(step, dt) {
    // Update all entities
    for (const id in this.entities) {
      const entity = this.entities[id];
      if (entity.markedForDelete) {
        entity.cleanup();
        this.deleted.push(id);
        if (delete this.entities[id]) {
          this.entityCount -= 1;
        }
      } else {
        entity.step(step, dt);
      }
    }
  }



  move(entity, dt) {
    // vb1 = a * t
    let { friction } = this;
    const { boundingBox } = entity;

    if (entity.friction > 0) {
      for (const icePatch of this.icePatches) {
        if (icePatch.intersects(boundingBox)) {
          friction /= 20;
          break;
        }
      }
    }

    entity.vectorBuffer1.set(entity.acceleration);
    entity.vectorBuffer1.scale(entity.friction * friction * dt);

    // v += a * t
    entity.velocity.add(entity.vectorBuffer1);

    entity.vectorBuffer1.set(entity.velocity);

    // Calculate friction and apply to velocity
    // friction = -µ * v * t
    entity.vectorBuffer1.scale(-entity.friction * friction * dt);

    // velocity += friction
    entity.velocity.add(entity.vectorBuffer1);

    if (entity.velocity.magnitude < 0.1) {
      entity.velocity.setXY(0, 0);
    }

    entity.vectorBuffer1.set(entity.velocity);
    entity.vectorBuffer1.scale(dt);

    // // Check whether or not entity moves
    // if (entity.vectorBuffer1.magnitude < 0.1) {
    //   if (entity.hasMoved) {
    //     entity.updatePosition();
    //   }
    //   entity.hasMoved = false;
    //   return false;
    // } else {
    //   entity.hasMoved = true;
    // }

    // Do full movement at once if no collision
    if (!entity.isCollidable) {
      entity.addPosition(entity.vectorBuffer1);
      return false;
    }

    // Use movement steps
    const STEPS = 4;
    entity.vectorBuffer1.scale(1 / STEPS);

    let collidedX = false;
    let collidedY = false;
    let collidedEntities = {};

    // Check collision with level geometry

    for (let i = 0; i < STEPS; i++) {
      // Attempt to move along X axis
      if (!collidedX) {
        const { x: oldX } = entity.position;
        entity.addPositionXY(entity.vectorBuffer1.x, 0);

        for (let j = 0; j < this.geometry.length; j++) {
          const shape = this.geometry[j];
          if (shape.intersects(entity.boundingBox)) {
            // Then we cannot move here
            // Revert to last valid position
            // Emit collision event
            entity.setPositionXY(oldX, entity.position.y);
            entity.velocity.setXY(entity.velocity.x * -entity.bounce, entity.velocity.y);
            collidedX = true;
            break;
          }
        }
      }

      if (!collidedY) {
        const { y: oldY } = entity.position;
        entity.addPositionXY(0, entity.vectorBuffer1.y);

        for (let j = 0; j < this.geometry.length; j++) {
          const shape = this.geometry[j];
          if (shape.intersects(entity.boundingBox)) {
            // Then we cannot move here
            // Revert to last valid position
            entity.setPositionXY(entity.position.x, oldY);
            entity.velocity.setXY(entity.velocity.x, entity.velocity.y * -entity.bounce);
            collidedY = true;
            break;
          }
        }
      }

      // Check for collision with other entities
      for (const id in this.entities) {
        if (id !== entity.id) {
          const otherEntity = this.findByID(id);
          if (!otherEntity.isCollidable) {
            continue;
          }
          if (entity.isSpectral && otherEntity.isSpectral) {
            continue;
          }
          if (otherEntity instanceof Projectile) {
            continue;
          }
          if (entity.boundingBox.intersects(otherEntity.boundingBox)) {
            collidedEntities[id] = otherEntity;
          }
        }
      }
    }

    let hadCollision = false;

    if (collidedX || collidedY) {
      const event = {
        type: 'GEOMETRY_COLLISION',
        data: {
          object: entity
        }
      };
      GM.emitEvent(event);
      hadCollision = true;
    }

    for (const id in collidedEntities) {
      const event = {
        type: 'OBJECT_COLLISION',
        data: {
          object1: entity,
          object2: collidedEntities[id]
        }
      };
      GM.emitEvent(event);

      // If it was not an ignored entity
      hadCollision = true;
      // if (ignore.indexOf(id) < 0) {
      //   hadCollision = true;
      // }
    }

    return hadCollision;
  }

  setBounds(x, y, width, height) {
    this.bounds = { x, y, width, height };
  }

  getStateAtTime(time) {
    const toAddBack = new Array(this.previousStates.size);
    let foundState = null;
    for (let i = this.previousStates.size - 1; i >= 0; i--) {
      const state = this.previousStates.pop();

      toAddBack[i] = state;
      if (state.time <= time) {
        // We good
        foundState = state;
        break;
      }
    }

    if (foundState) {
      return foundState;
    } else {
      // Add the states back to the queue
      for (let i = 0; i < toAddBack.length; i++) {
        this.previousStates.push(toAddBack[i]);
      }
      return null;
    }
  }

  rollbackFrom(time) {
    // Revert to the state
    const state = this.getStateAtTime(time);
    this.revertState(state);

    let elapsed = time;

    // Find the events after this
    const listener = GM.registerHandler('STEP', event => {
      const { dt } = event;
      elapsed += dt;
      const state = [];
      for (const entity of this.getEntities()) {
        state.push(entity.serialize());
      }
      const stateEntry = {
        time: elapsed,
        state: this.previousState
      };
      this.previousStates.enqueue(stateEntry);
    });

    GM.timeElapsed = time;

    // const listener2 = GM.registerHandler('HIT_OBJECT', console.log);

    const events = [];
    for (const event of GM.eventsAfterTime(time)) {
      events.push(event);
    }

    console.log('BEGIN ROLLBACK');
    GM.rollback = true;

    for (const event of events) {
      if (event.type === 'STEP') {
        GM.step(event.data.dt, event.id);
      } else {
        GM.emitEvent(event);
      }
    }
    GM.rollback = false;

    console.log('END ROLLBACK');

    // GM.removeHandler('HIT_OBJECT', listener2);
    GM.removeHandler('STEP', listener);
  }

  revertState(state) {
    const ids = {};

    // Sync all objects
    for (const obj of state.state) {
      this.receiveSyncObject(obj);
      ids[obj.id] = true;
    }

    // Remove all other objects
    for (const entity of this.getEntities()) {
      if (!ids[entity.id]) {
        entity.markForDelete();
      }
    }
  }

  createEntity(type) {
    const EntityType = this.entityTable[type];
    if (EntityType) {
      return new EntityType();
    } else {
      return null;
    }
  }

  serializeAll() {
    const batch = [];
    for (const entity of this.getEntities()) {
      batch.push(entity.serialize());
    }
    return batch;
  }

  /**
   * Syncs the state of the world to the specified socket using the specified
   * server. If the `forceSync` parameter is set to `true`, the current state
   * will be synced in full. If it is `false`, only the changes since the last
   * state will be synced.
   * @param server The server to send the sync message from
   * @param socket The socket to send the sync message to
   * @param forceSync Whether or not to sync the full world state
   */
  sync(server, socket = -1, forceSync = true) {
    if (server.numConnections > 0) {
      const batch = [];
      if (forceSync) {
        for (const entity of this.getEntities()) {
          if (entity.doSynchronize) {
            batch.push(entity.serialize());
          }
        }
      } else {
        // Check each object against the previous state
        const state = {};
        for (const entity of this.getEntities()) {
          // Only synchronize entities with synchronize enabled
          if (entity.doSynchronize) {
            const serialized = entity.serialize();

            // Add it to the state
            state[entity.id] = serialized;

            // Compare it to the previous state
            const previous = this.previousState[entity.id];

            if (previous !== undefined) {
              // Only record diffs
              const change = diff(previous, serialized);
              if (Object.keys(change).length > 0) {
                change.id = serialized.id;
                batch.push(change);
              } else {
                // Objects are identical; do nothing
              }
            } else {
              // New entity
              batch.push(serialized);
            }
          }
        }
        this.previousState = state;
      }

      if (batch.length > 0) {
        // Determine size of batch
        const size = sizeOf(batch);
        NM.send({
          type: 'SYNC_OBJECT_BATCH',
          data: {
            time: GM.timeElapsed,
            objects: batch
          }
        }, socket);
      }
      if (this.deleted.length > 0) {
        NM.send({
          type: 'SYNC_DELETE_OBJECT_BATCH',
          data: {
            ids: this.deleted
          }
        }, socket);
        this.deleted = [];
      }
    }
  }

  getEntityCount() {
    return this.entityCount;
  }

  syncObjectClient(client, object) {
    const packet = {
      type: 'SYNC_OBJECT',
      data: {
        object: object.serialize()
      }
    };
    NM.send(packet);
  }

  receiveSyncObject(object) {
    let existing = this.findByID(object.id);
    let created = false;
    if (!existing) {
      const newObject = this.createEntity(object.type);
      if (newObject) {
        newObject.setID(object.id);
        existing = newObject;
        created = true;
      }
    }
    if (existing) {
      existing.deserialize(object);
      if (created) {
        this.add(existing);
      }
      // if (SETTINGS.predictionEnabled && isClient()) {
      //   if (existing instanceof Hero && existing.isCurrentHero()) {
      //     // foo
      //   } else {
      //     // existing.step(-1, 1);
      //   }
      // }
    }
  }

  deleteAllNonHero() {
    for (const key in this.entities) {
      const entity = this.entities[key];
      if (!(entity instanceof Hero)) {
        entity.markForDelete();
      }
    }
  }
}

const WM = new WorldManager();
export default WM;