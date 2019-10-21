import GM from '../event/GameManager';
import { isClient } from '../util/util';

class WorldManager {
  constructor() {
    this.entities = [];
    this.removeQueue = [];
    this.addQueue = [];
    this.entityGenerator = () => null;
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
    // Remove marked entities
    for (let i = 0; i < this.removeQueue.length; i++) {
      const entity = this.removeQueue[i];
      delete this.entities[entity.id];
    }
    this.removeQueue = [];

    // Update all entities
    for (const id in this.entities) {
      const entity = this.entities[id];
      entity.step(step, dt);
    }
  }

  sync(server) {
    for (const id in this.entities) {
      const entity = this.entities[id];
      server.send({
        type: 'SYNC_OBJECT',
        data: {
          object: entity.serialize()
        }
      });
    }
  }
}

const WM = new WorldManager();
export default WM;