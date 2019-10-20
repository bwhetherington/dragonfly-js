import GM from '../event/GameManager';

class WorldManager {
  constructor() {
    this.entities = [];
    this.removeQueue = [];
    this.addQueue = [];
  }

  initialize() {
    GM.registerHandler('step', () => {
      this.step();
    });
  }

  findByID(id) {
    return this.entities[id] || null;
  }

  add(entity) {
    this.addQueue.push(entity);
  }

  step() {
    // Remove marked entities
    for (let i = 0; i < this.removeQueue.length; i++) {
      const entity = this.removeQueue[i];
      delete this.entities[entity.id];
    }
    this.removeQueue = [];

    // Add entities
    for (let i = 0; i < this.addQueue.length; i++) {
      const entity = this.addQueue[i];
      this.entities[entity.id] = entity;
    }
    this.addQueue = [];

    // Update all entities
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      entity.step()
    }
  }
}

const WM = new WorldManager();
export default WM;