export const isServer = () => !isClient();

export const isClient = () => {
  try {
    window;
    return true;
  } catch (_) {
    return false;
  }
};

export const initializeInput = node => {
  GM.registerHandler('KEY_DOWN', event => {
    const hero = this.heroes[event.socketIndex];
    switch (event.key) {
      case 'KeyW':
        hero.setInput('up', true);
        break;
      case 'KeyS':
        hero.setInput('down', true);
        break;
      case 'KeyA':
        hero.setInput('left', true);
        break;
      case 'KeyD':
        hero.setInput('right', true);
        break;
      case 'KeyF':
        hero.applyForce(new Vector(100, 0));
        break;
      case 'KeyQ':
        hero.setWeapon(Pistol);
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        hero.setSlow(true);
        break;
    };
  });
  GM.registerHandler('KEY_UP', event => {
    const hero = this.heroes[event.socketIndex];
    switch (event.key) {
      case 'KeyW':
        hero.setInput('up', false);
        break;
      case 'KeyS':
        hero.setInput('down', false);
        break;
      case 'KeyA':
        hero.setInput('left', false);
        break;
      case 'KeyD':
        hero.setInput('right', false);
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        hero.setSlow(false);
        break;
    };
  });
}