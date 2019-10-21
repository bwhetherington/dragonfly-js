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

  window.addEventListener('mousedown', event => {
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
  window.addEventListener('mouseup', event => {
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
  constructor(addr) {
    this.sendBuffer = [];
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

  initialize(window, two) {
    attachInput(window);

    GM.registerHandler('SYNC_OBJECT', event => {
      const { id, type } = event.object;
      let object = WM.findByID(id);
      if (object === null) {
        // Create new object
        object = WM.generateEntity(type);
        if (object) {
          // Set its ID
          object.setID(id);
          WM.add(object);
        } else {
          console.log(`Unknown entity type: ${type}`);
        }
      }
      // Deserialize it
      if (object) {
        object.deserialize(event.object);
      }
    });

    two.bind('update', (_, dt) => {
      const seconds = dt / 1000.0;
      if (!Number.isNaN(seconds)) {
        GM.step(seconds);
      }
    }).play();
  }

  onClose() { }

  /**
   * This methos is triggered when the socket receives a message from the 
   * server.
   * @param message The received message
   */
  onMessage(message) {
    if (message.type === 'SYNC_OBJECT') {
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
    if (this.socket.readyState === 1) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.sendBuffer.push(message);
    }
  }
}

export default Client;