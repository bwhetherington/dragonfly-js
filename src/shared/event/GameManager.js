class GameManager {
  constructor() {
    this.eventQueue = [];
    this.handlers = {};
    this.stepCount = 0;
  }

  pollEvents() {
    for (let i = 0; i < this.eventQueue.length; i++) {
      this.handleEvent(this.eventQueue[i]);
    }
    this.eventQueue = [];
  }

  registerHandler(type, handler) {
    let handlers = this.handlers[type];
    if (handlers === undefined) {
      handlers = [];
      this.handlers[type] = handlers;
    }
    handlers.push(handler);
  }

  handleEvent(event) {
    const { type, data } = event;
    const handlers = this.handlers[type];
    if (handlers) {
      for (let i = 0; i < handlers.length; i++) {
        const handler = handlers[i];
        handler(data);
      }
    }
  }

  emitEvent(event) {
    this.eventQueue.push(event);
  }

  /**
   * This method should be called by a separate timer on the client and the
   * server for accuracy's sake.
   */
  step(dt) {
    const stepEvent = {
      type: 'STEP',
      data: {
        step: this.stepCount,
        dt
      }
    };
    this.stepCount += 1;
    this.emitEvent(stepEvent);
    this.pollEvents();
  }
}

const GM = new GameManager();
export default GM;