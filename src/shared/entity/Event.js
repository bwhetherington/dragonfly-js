import uuid from 'uuid/v1';

class Event {
  constructor(event) {
    // Store all of that event's fields
    this.data = event;
    this.id = uuid();
    this.sideEffects = [];
  }

  addEntity(entity) {

  }
}