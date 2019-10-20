import GM from '../event/GameManager';

class WorldManager {
  constructor() {
    this.entities = [];
    this.idCount = 0;
    this.removeQueue = [];
    this.addQueue = [];
  }

  initialize() {
    GM.registerHandler('step', () => {
      this.step();
    });
  }

  generateID() {
    const id = this.idCount;
    this.idCount += 1;
    return id;
  }

  findByID(id) {
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      if (entity.id === id) {
        return entity;
      }
    }
    return null;
  }

  add(entity) {
    const id = this.generateID();
    entity.id = id;
    this.addQueue.push(entity);
  }

  step() {
    // Remove marked entities
    if (this.removeQueue.length > 0) {
      this.entities = this.entities.filter(entity => {
        return this.removeQueue.indexOf(entity.id) > -1;
      });
      this.removeQueue = [];
    }

    // Add entities
    for (let i = 0; i < this.addQueue.length; i++) {
      this.entities.push(this.addQueue[i]);
    }
    this.addQueue = [];
  }
}

const WM = new WorldManager();
export default WM;