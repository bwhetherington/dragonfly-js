import Queue from '../util/Queue';
import uuid from 'uuid/v1';

class GameManager {
  constructor() {
    this.eventQueue = new Queue();
    this.handlers = {};
    this.stepCount = 0;
    this.timeElapsed = 0;
  }

  pollEvents() {
    let event;
    while ((event = this.eventQueue.dequeue())) {
      this.handleEvent(event);
    }
  }

  registerHandler(type, handler) {
    let handlers = this.handlers[type];
    if (handlers === undefined) {
      handlers = {};
      this.handlers[type] = handlers;
    }
    // Generate uuid
    const id = uuid();
    handlers[id] = handler;
    return id;
  }

  removeHandler(type, id) {
    const handlers = this.handlers[type];
    if (handlers) {
      delete handlers[id];
    }
  }

  handleEvent(event) {
    const { type, data } = event;
    if (type === 'ANY') {
      for (const type in this.handlers) {
        for (const handlerID in this.handlers[type]) {
          const handler = this.handlers[type][handlerID];
          handler(event, handlerID);
        }
      }
    }
    const handlers = this.handlers[type];
    if (handlers) {
      for (const id in handlers) {
        const handler = handlers[id];
        handler(data, () => this.removeHandler(type, id));
      }
    }
  }

  emitEvent(event) {
    this.eventQueue.enqueue(event);
  }

  /**
   * This method should be called by a separate timer on the client and the
   * server for accuracy's sake.
   */
  step(dt) {
    this.timeElapsed += dt;
    if (this.timeElapsed >= 2) {
      this.timeElapsed -= 2;

      // Sum up all listeners
      let count = 0;
      for (const type in this.handlers) {
        for (const id in this.handlers[type]) {
          count += 1;
        }
      }
      console.log(`Handlers: ${count}`);
    }

    const stepEvent = {
      type: 'STEP',
      data: {
        step: this.stepCount,
        dt
      }
    };
    this.stepCount += 1;
    this.handleEvent(stepEvent);
    this.pollEvents();
  }
}

const GM = new GameManager();
export default GM;