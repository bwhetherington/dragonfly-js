import Two from 'twojs-ts';
import GM from '../shared/event/GameManager';
import './index.css';
import Client from '../shared/network/Client';
import Entity from '../shared/entity/Entity';

const removeChildren = element => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

const entity = new Entity();

class GameClient extends Client {
  onMessage(message) {
    console.log('received', message);
    if (message.type === 'sync') {
      entity.deserialize(message.object);
    }
  }
}

const syncWindowSize = two => {
  const { width, height } = window;
  two.renderer.setSize(width, height);
  two.width = width;
  two.height = height;
}

const main = async () => {
  console.log(Two.Types);
  const element = document.getElementById('game');
  removeChildren(element);
  const two = new Two({
    fullscreen: true,
    autostart: true
  }).appendTo(element);

  two.scene.translation.set(-window.width / 2, -window.height / 2);

  const square = two.makeRectangle(two.width / 2, two.height / 2, 30, 30);
  square.fill = '#FF8000';
  square.stroke = 'orangered'; // Accepts all valid css color
  square.linewidth = 5;

  // Start websocket client
  const client = new GameClient();
  client.send({ name: 'Benjamin ' });

  entity.graphicsObject = square;

  GM.registerHandler('step', ({ step, dt }) => {
    entity.updateGraphics();
    // square.translation.y += dt * 30;
  });

  two.bind('update', (_, dt) => {
    const seconds = dt / 1000.0;
    if (!Number.isNaN(seconds)) {
      GM.step(seconds);
      entity.step(seconds);
    }
  }).play();
};

main();

// if (module.hot) {
//   module.hot.accept();
// }
