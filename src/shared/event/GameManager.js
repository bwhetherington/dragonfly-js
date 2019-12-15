import Queue from '../util/Queue';
import SizedQueue from '../util/SizedQueue';
// import uuid from 'uuid/v1';
import WM from '../entity/WorldManager';
import { isServer, uuid } from '../util/util';
import NM from '../network/NetworkManager';
import LM from '../network/LogManager';

class GameManager {
  constructor() {
    this.eventQueue = new Queue();
    this.handlers = {};
    this.stepCount = 0;
    this.timeElapsed = 0;
    this.handlerCount = 0;
    this.frameRate = 0;
    this.currentEventID = null;
    this.createRootEvent();
    if (isServer()) {
      this.storedEvents = new SizedQueue(1000);
    } else {
      this.storedEvents = null;
    }
    this.recordedTypes = {};
  }

  recordType(type) {
    this.recordedTypes[type] = true;
  }

  doesRecordType(type) {
    // Converts it to a boolean
    // Yes we meant to have two exclamation marks
    return !!(this.recordedTypes[type]);
  }

  createRootEvent() {
    const id = uuid();
    const time = this.timeElapsed;
    const rootEvent = {
      type: 'ROOT',
      data: {},
      id,
      time
    };
    this.currentEventID = id;
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

  runOnce(callback) {
    this.runDelay(0, callback);
  }

  recordEvent(event) {
    if (this.storedEvents) {
      event.time = GM.timeElapsed;
      this.storedEvents.enqueue(event);
    }
  }

  getCurrentEventID() {
    return this.currentEventID;
  }

  handleEvent(event) {
    const { type, data, id } = event;
    const record = this.doesRecordType(type);
    if (record) {
      this.currentEventID = id;
    }

    const handlers = this.handlers[type];
    if (handlers) {
      for (const id in handlers) {
        const handler = handlers[id];
        handler(data, () => this.removeHandler(type, id));
      }
    }

    const anyHandlers = this.handlers['ANY'];
    for (const id in anyHandlers) {
      const handler = anyHandlers[id];
      handler(data, () => this.removeHandler('ANY', id));
    }

    if (record) {
      this.currentEventID = null;
      this.recordEvent(event);
    }

    if ('socketIndex' in data) {
      LM.logData(event, data.socketIndex);
    } else {
      LM.logData(event);
    }
  }

  // addEntity(entity) {
  //   // We check if we've already added an entity for this event
  //   const eventID = this.getCurrentEventID();
  //   const eventEntry = this.createdEntities[eventID];

  //   if (isServer() && eventEntry) {
  //     const serialized = eventEntry.entities[eventEntry.counter];

  //     if (serialized) {
  //       // Deserialize to that state
  //       entity.deserialize(serialized);
  //     } else {
  //       // Created a new entity; add it to the list
  //       eventEntry.entities[eventEntry.counter] = entity.serialize();
  //     }

  //     eventEntry.counter += 1;
  //   }
  //   WM.add(entity);
  //   if (eventEntry) {
  //     // NM.logCode('isReplay', !!this.rollback, eventEntry);
  //   }
  // }

  prepEvent(event) {
    if (event.id === undefined) {
      event.id = uuid();
    }
  }

  emitEventFirst(event) {
    this.prepEvent(event);
    this.eventQueue.prepend(event);
  }

  emitEvent(event) {
    this.prepEvent(event);
    this.eventQueue.enqueue(event);
  }

  /**
   * This method should be called by a separate timer on the client and the
   * server for accuracy's sake.
   */
  step(dt, id = undefined) {
    this.frameRate = 1.0 / dt;

    WM.recordState();

    const stepEvent = {
      type: 'STEP',
      id,
      data: {
        step: this.stepCount,
        dt
      }
    };

    this.pollEvents();

    // We are deliberately not polling events here
    // This means that any events emitted in a step event handler get handled
    // in the next step, and ensures that the step event is the absolute last
    // event handled in any given step
    this.prepEvent(stepEvent);
    this.handleEvent(stepEvent);
    this.stepCount += 1;
    this.timeElapsed += dt;
  }

  getHandlerCount() {
    return this.handlerCount;
  }

  *eventsAfterTime(time) {
    const events = [];

    let event;
    while ((event = this.storedEvents.pop()) !== null) {
      if (event.time < time) {
        this.storedEvents.push(event);
        break;
      } else {
        events.push(event);
      }
    }

    // Iterate backwards over the list
    for (let i = events.length - 1; i >= 0; i--) {
      yield events[i];
    }
  }
}

const GM = new GameManager();
export default GM;