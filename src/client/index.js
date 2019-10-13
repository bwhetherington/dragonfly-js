import './index.css';
import Two from 'twojs-ts';

const main = async () => {
  const element = document.getElementById('game');

  const two = new Two({ fullScreen: true, autostart: true }).appendTo(element);

  const rect = two.makeRectangle(two.width / 2, two.height / 2, 50, 50);

  two.bind('update', () => {
    rect.rotation += 0.005;
  });

  // two.bind('update', (step, dt) => {
  //   console.log(`step: ${step}, dt: ${dt}ms`);
  // });

  two.bind('all', console.log);

};

main();
