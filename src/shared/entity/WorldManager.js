import GM from '../event/GameManager';
import { isClient } from '../util/util';

class WorldManager {
  constructor() {
    this.entities = {};
    this.deleted = [];
    this.entityGenerator = () => null;
    this.setBounds(0, 0, 500, 500);
  }

  setEntityGenerator(generator) {
    this.entityGenerator = generator;
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