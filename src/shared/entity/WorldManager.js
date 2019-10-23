import GM from '../event/GameManager';
import { isClient } from '../util/util';
import Rectangle from '../util/Rectangle';
import InverseRectangle from '../util/InverseRectangle';

class WorldManager {
  constructor() {
    this.entities = {};
    this.deleted = [];
    this.entityGenerator = () => null;
    this.setBounds(0, 0, 500, 500);
    this.geometry = [];
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
          return new InverseRectangle(x, y, width, height);
        default:
          return null;
      }
    }).filter(shape => shape !== null);
  }

  generateEntity(type) {
    return this.entityGenerator(type);
  }

  initialize() {
    GM.registerHandler('STEP', ({ step, dt }) => {
      this.step(step, dt);
    });
  }

  findByID(id) {
    return this.entities[id] || null;
  }

  add(entity) {
    this.entities[entity.id] = entity;
  }

  step(step, dt) {
    // Update all entities
    for (const id in this.entities) {
      const entity = this.entities[id];
      if (entity.markedForDelete) {
        entity.cleanup();
        this.deleted.push(id);
        delete this.entities[id];
      } else {
        entity.step(step, dt);
      }
    }
  }

  move(entity, dt) {
    entity.vectorBuffer.set(entity.velocity);
    entity.vectorBuffer.add(entity.force);
    entity.vectorBuffer.scale(dt);

    // Use quarter steps
    const STEPS = 4;
    entity.vectorBuffer.scale(1 / STEPS);

    let collidedX = false;
    let collidedY = false;
    let collidedEntities = {};

    // Check collision with level geometry
    for (let i = 0; i < STEPS; i++) {
      // Attempt to move along X axis
      if (!collidedX) {
        const { x: oldX } = entity.position;
        entity.addPositionXY(entity.vectorBuffer.x, 0);

        for (let j = 0; j < this.geometry.length; j++) {
          const shape = this.geometry[j];
          if (shape.intersects(entity.boundingBox)) {
            // Then we cannot move here
            // Revert to last valid position
            // Emit collision event
            entity.setPositionXY(oldX, entity.position.y);
            collidedX = true;
            break;
          }
        }
      }

      if (!collidedY) {
        const { y: oldY } = entity.position;
        entity.addPositionXY(0, entity.vectorBuffer.y);

        for (let j = 0; j < this.geometry.length; j++) {
          const shape = this.geometry[j];
          if (shape.intersects(entity.boundingBox)) {
            // Then we cannot move here
            // Revert to last valid position
            entity.setPositionXY(entity.position.x, oldY);
            collidedY = true;
            break;
          }
        }
      }

      // Check for collision with other entities
      for (const id in this.entities) {
        if (id !== entity.id) {
          const otherEntity = this.findByID(id);
          if (entity.boundingBox.intersects(otherEntity.boundingBox)) {
            collidedEntities[id] = otherEntity;
          }
        }
      }
    }

    if (collidedX || collidedY) {
      const event = {
        type: 'GEOMETRY_COLLISION',
        data: {
          object: entity
        }
      };
      GM.emitEvent(event);
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
    }
  }

  setBounds(x, y, width, height) {
    this.bounds = { x, y, width, height };
  }

  sync(server) {
    const batch = [];
    for (const id in this.entities) {
      const entity = this.entities[id];
      batch.push(entity.serialize());
    }
    if (batch.length > 0) {
      server.send({
        type: 'SYNC_OBJECT_BATCH',
        data: {
          objects: batch
        }
      });
    }
    if (this.deleted.length > 0) {
      server.send({
        type: 'SYNC_DELETE_OBJECT_BATCH',
        data: {
          ids: this.deleted
        }
      });
      this.deleted = [];
    }
  }
}

const WM = new WorldManager();
export default WM;