import GM from '../event/GameManager';
import WM from '../entity/WorldManager';
import NM from './NetworkManager';

const transformClientCoordinates = (two, x, y) => {
  return {
    x: x - two.scene.translation.x,
    y: y - two.scene.translation.y
  };
}

class Client {
  constructor(two, addr) {
    this.two = two;
    this.sendBuffer = [];
    this.keyStates = {};
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

  attachInput(two, root) {
    root.addEventListener('keydown', event => {
      const { code, shiftKey, ctrlKey } = event;
      if (!this.keyStates[code]) {
        this.keyStates[code] = true;
        const newEvent = {
          type: 'KEY_DOWN',
          data: {
            key: code,
            shift: shiftKey,
            ctrl: ctrlKey
          }
        };
        GM.emitEvent(newEvent);
      }
    });

    root.addEventListener('keyup', event => {
      const { code, shiftKey, ctrlKey } = event;
      if (this.keyStates[code]) {
        delete this.keyStates[code];
        const newEvent = {
          type: 'KEY_UP',
          data: {
            key: code,
            shift: shiftKey,
            ctrl: ctrlKey
          }
        };
        GM.emitEvent(newEvent);
      }
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

    GM.registerHandler('KEY_DOWN', e => console.log('KEY_DOWN', e));
    GM.registerHandler('KEY_UP', e => console.log('KEY_UP', e));

    // Turn off all input when the user stops focusin on the game
    // root.addEventListener('focusout', () => {
    //   GM.emitEvent({
    //     type: 'KEY_UP',
    //     data: {
    //       key: 'KeyW'
    //     }
    //   });
    //   GM.emitEvent({
    //     type: 'KEY_UP',
    //     data: {
    //       key: 'KeyS'
    //     }
    //   });
    //   GM.emitEvent({
    //     type: 'KEY_UP',
    //     data: {
    //       key: 'KeyA'
    //     }
    //   });
    //   GM.emitEvent({
    //     type: 'KEY_UP',
    //     data: {
    //       key: 'KeyD'
    //     }
    //   });
    // });
  };

  syncObject(object) {
    WM.receiveSyncObject(object);
  }

  initialize(window) {
    this.attachInput(this.two, window);
    NM.initialize(this);

    GM.registerHandler('CREATE_OBJECT', event => {
      event.object.initializeGraphicsInternal(this.two);
    });

    // Batch sync
    GM.registerHandler('SYNC_OBJECT_BATCH', event => {
      GM.timeElapsed = event.time;
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

        // Only delete the entity if it is synchronizable
        if (entity && (entity.doSynchronize || event.forceDelete)) {
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
    if (message.type === 'CHECK_PING') {
      this.send(message);
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
}

export default Client;