import Queue from '../util/Queue';
import SizedQueue from '../util/SizedQueue';
import uuid from 'uuid/v1';

class GameManager {
  constructor() {
    this.eventQueue = new Queue();
    this.handlers = {};
    this.stepCount = 0;
    this.timeElapsed = 0;
    this.handlerCount = 0;
    this.frameRate = 0;
    // this.storedEvents = new SizedQueue(1000);
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
    this.handlerCount += 1;
    return id;
  }

  removeHandler(type, id) {
    const handlers = this.handlers[type];
    if (handlers) {
      if (delete handlers[id]) {
        this.handlerCount -= 1;
      }
    }
  }

  runTimer(interval, callback) {
    let elapsed = 0;
    this.registerHandler('STEP', event => {
      elapsed += event.dt;
      while (elapsed >= interval) {
        elapsed -= interval;
        callback();
      }
    });
  }

  runDelay(seconds, callback) {
    let elapsed = 0;
    this.registerHandler('STEP', (event, remove) => {
      elapsed += event.dt;
      if (elapsed >= seconds) {
        callback();
        remove();
      }
    })
  }

  recordEvent(event) {
    // this.storedEvents.enqueue(event);
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

    this.frameRate = 1.0 / dt;

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

  getHandlerCount() {
    return this.handlerCount;
  }

  *eventsAfterTime(time) {
    for (const event of this.storedEvents) {
      // Yield every event from the frame after the state
      if (event.data.timeStamp > time) {
        yield event;
      }
    }
  }
}

const GM = new GameManager();
export default GM;