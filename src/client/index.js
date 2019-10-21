import Two from 'twojs-ts';
import './index.css';
import Client from './GameClient';
import Entity from '../shared/entity/Entity';
import WM from '../shared/entity/WorldManager';

const removeChildren = element => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

const main = async () => {
  WM.setEntityGenerator(type => {
    switch (type) {
      case 'Entity':
        console.log('Create entity');
        const entity = new Entity();
        entity.initializeGraphics(two);
        return entity;
      case 'Hero':
        console.log('Create hero');
        const hero = new Entity();
        hero.initializeGraphics(two);
        return hero;
      default:
        return null;
    }
  });
  WM.initialize();

  const element = document.getElementById('game');
  removeChildren(element);
  const two = new Two({
    fullscreen: true,
    autostart: true
  }).appendTo(element);

  // two.scene.translation.set(-window.width / 2, -window.height / 2);

  // Start websocket client
  const client = new Client();
  client.initialize(window, two);
};

main();

// if (module.hot) {
//   module.hot.accept();
// }
