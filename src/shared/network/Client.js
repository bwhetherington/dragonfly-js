import GM from '../event/GameManager';
import WM from '../entity/WorldManager';
import NM from './NetworkManager';
import uuid from 'uuid/v1';

const transformClientCoordinates = (two, x, y) => {
  return {
    x: x - two.scene.translation.x,
    y: y - two.scene.translation.y
  };
}

const attachInput = (two, root) => {
  root.addEventListener('keydown', event => {
    const newEvent = {
      type: 'KEY_DOWN',
      data: {
        key: event.code,
        shift: event.shiftKey,
        ctrl: event.ctrlKey
      }
    };
    GM.emitEvent(newEvent);
  });

  root.addEventListener('keyup', event => {
    const newEvent = {
      type: 'KEY_UP',
      data: {
        key: event.code,
        shift: event.shiftKey,
        ctrl: event.ctrlKey
      }
    };
    GM.emitEvent(newEvent);
  });

  root.addEventListener('mousedown', event => {
    const { x, y } = transformClientCoordinates(two, event.clientX, event.clientY);
    const newEvent = {
      type: 'MOUSE_DOWN',
      data: {
        button: event.button,
        position: { x, y }
      }
    };
    GM.emitEvent(newEvent);
  });

  root.addEventListener('mouseup', event => {
    const { x, y } = transformClientCoordinates(two, event.clientX, event.clientY);
    const newEvent = {
      type: 'MOUSE_UP',
      data: {
        button: event.button,
        position: { x, y }
      }
    };
    GM.emitEvent(newEvent);
  });

  root.addEventListener('mousemove', event => {
    const { x, y } = transformClientCoordinates(two, event.clientX, event.clientY);
    const newEvent = {
      type: 'MOUSE_MOVE',
      data: {
        position: { x, y }
      }
    };
    GM.emitEvent(newEvent);
  });
};

class Client {
  constructor(two, addr) {
    this.two = two;
    this.sendBuffer = [];
    this.pingChecks = {};
    if (!addr) {
      addr = `ws://${location.host}`;
    }
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
    WM.receiveSyncObject(object);
  }

  initialize(window) {
    attachInput(this.two, window);
    NM.initialize(this);

    GM.registerHandler('CREATE_OBJECT', event => {
      event.object.initializeGraphicsInternal(this.two);
    });

    // Batch sync
    GM.registerHandler('SYNC_OBJECT_BATCH', event => {
      for (let i = 0; i < event.objects.length; i++) {
        this.syncObject(event.objects[i]);
      }
    });

    // Single sync
    GM.registerHandler('SYNC_OBJECT', event => {
      WM.receiveSyncObject(event.object);
    });

    GM.registerHandler('SYNC_DELETE_OBJECT_BATCH', event => {
      for (let i = 0; i < event.ids.length; i++) {
        const id = event.ids[i];
        const entity = WM.findByID(id);
        console
        if (entity) {
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

  onClose() {
    console.log('closed');
  }

  /**
   * Passes messages received into the event loop.
   * @param message The received message
   */
  onMessage(message) {
    if (message.type === 'PING_SERVER') {
      const { id, playerID } = message.data;
      const handler = this.pingChecks[id];
      if (handler) {
        const { resolve, start } = handler;
        const end = Date.now();
        const time = end - start;
        resolve(time);
        delete this.pingChecks[id];
      }
    } else {
      GM.emitEvent(message);
    }
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
    message.time = Date.now();
    if (this.socket.readyState === 1) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.sendBuffer.push(message);
    }
  }

  getPing() {
    return new Promise(resolve => {
      const start = Date.now();
      const id = uuid();
      const playerID = this.playerID;
      const packet = {
        type: 'PING_CLIENT',
        data: { id, playerID }
      };
      NM.send(packet);
      this.pingChecks[id] = {
        start,
        resolve
      };
      // Ping request times out after 2000 seconds
      setTimeout(() => {
        delete this.pingChecks[id];
      }, 2000)
    });
  }
}

export default Client;