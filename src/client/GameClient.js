import Client from '../shared/network/Client';
import GM from '../shared/event/GameManager';

class GameClient extends Client {
  initialize(window, two) {
    super.initialize(window, two);

    // Register handlers to send to server
    GM.registerHandler('KEY_DOWN', event => {
      this.send({
        type: 'KEY_DOWN',
        data: event
      });
    });

    GM.registerHandler('KEY_UP', event => {
      this.send({
        type: 'KEY_UP',
        data: event
      });
    });

    GM.registerHandler('MOUSE_DOWN', event => {
      this.send({
        type: 'MOUSE_DOWN',
        data: event
      });
    })

    GM.registerHandler('MOUSE_UP', event => {
      this.send({
        type: 'MOUSE_UP',
        data: event
      });
    })
  }
}

export default GameClient;