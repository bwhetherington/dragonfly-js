import GM from '../event/GameManager';
import WM from '../entity/WorldManager';

const attachInput = root => {
  root.addEventListener('keydown', event => {
    const newEvent = {
      type: 'KEY_DOWN',
      data: {
        key: event.key
      }
    };
    GM.emitEvent(newEvent);
  });

  root.addEventListener('keyup', event => {
    const newEvent = {
      type: 'KEY_UP',
      data: {
        key: event.key
      }
    };
    GM.emitEvent(newEvent);
  });

  root.addEventListener('mousedown', event => {
    const newEvent = {
      type: 'MOUSE_DOWN',
      data: {
        button: event.button,
        x: event.clientX,
        y: event.clientY
      }
    };
    GM.emitEvent(newEvent);
  });

  root.addEventListener('mouseup', event => {
    const newEvent = {
      type: 'MOUSE_UP',
      data: {
        button: event.button,
        x: event.clientX,
        y: event.clientY
      }
    };
    GM.emitEvent(newEvent);
  });

  root.addEventListener('mousemove', event => {
    const newEvent = {
      type: 'MOUSE_MOVE',
      data: {
        position: {
          x: event.clientX,
          y: event.clientY
        }
      }
    };
    GM.emitEvent(newEvent);
  });
};

class Client {
  constructor(two, addr) {
    this.two = two;
    this.sendBuffer = [];
    if (!addr) {
      addr = `ws://${location.host}`;
    }
    console.log(addr);
    this.socket = new WebSocket(addr);
    this.socket.onmessage = message => {
      this.onMessage(JSON.parse(message.data));
    }
    this.socket.onclose = this.onClose.bind(this);
    this.socket.onopen = () => {
      for (let i = 0; i < this.sendBuffer.length; i++) {
        this.send(this.sendBuffer[i]);
      }
      this.sendBuffer = [];
      this.onOpen();
    };
    this.socket.onerror = console.log;
  }

  syncObject(object) {
    let existing = WM.findByID(object.id);
    if (!existing) {
      const newObject = WM.generateEntity(object.type);
      if (newObject) {
        newObject.setID(object.id);
        WM.add(newObject);
        existing = newObject;
      }
    }
    if (existing) {
      existing.deserialize(object);
      const createEvent = {
        type: 'CREATE_OBJECT',
        data: {
          object
        }
      };
      GM.emitEvent(createEvent);
    }
  }

  initialize(window) {
    attachInput(window);

    // Batch sync
    GM.registerHandler('SYNC_OBJECT_BATCH', event => {
      for (let i = 0; i < event.objects.length; i++) {
        this.syncObject(event.objects[i]);
      }
    });

    // Single sync
    GM.registerHandler('SYNC_OBJECT', event => {
      this.syncObject(event.object);
    });

    GM.registerHandler('SYNC_DELETE_OBJECT_BATCH', event => {
      for (let i = 0; i < event.ids.length; i++) {
        const id = event.ids[i];
        const entity = WM.findByID(id);
        if (entity) {
          console.log('delete', entity);
          entity.markForDelete();
        }
      }
    });

    this.two.bind('update', (_, dt) => {
      const seconds = dt / 1000.0;
      if (!Number.isNaN(seconds)) {
        GM.step(seconds);
      }
    }).play();
  }

  onClose() { }

  /**
   * Passes messages received into the event loop.
   * @param message The received message
   */
  onMessage(message) {
    GM.emitEvent(message);
  }

  /**
   * This method is triggered when the socket is opened.
   */
  onOpen() { }

  /**
   * Sends the specified message across the websocket.
   * @param message The message to send
   */
  send(message) {
    if (this.socket.readyState === 1) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.sendBuffer.push(message);
    }
  }
}

export default Client;