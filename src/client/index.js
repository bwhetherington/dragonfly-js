import Two from 'twojs-ts';
import GM from '../shared/event/GameManager';
import './index.css';

const removeChildren = element => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

const main = async () => {
  const element = document.getElementById('game');
  removeChildren(element);
  const two = new Two().appendTo(element);

  const square = two.makeRectangle(two.width / 2, two.height / 2, 30, 30);
  square.fill = '#FF8000';
  square.stroke = 'orangered'; // Accepts all valid css color
  square.linewidth = 5;

  GM.registerHandler('step', ({ step, dt }) => {
    if (!Number.isNaN(dt)) {
      // square.rotation += dt;
      square.translation.y += dt * 30;
    }
  });

  two.bind('update', (_, dt) => {
    const seconds = dt / 1000.0;
    GM.step(seconds);
  }).play();
};

main();

// if (module.hot) {
//   module.hot.accept();
// }
