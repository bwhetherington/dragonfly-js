import WM from "../entity/WorldManager";

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

export const diff = (a, b) => {
  const obj = {};

  for (const key in b) {
    if (!equals(a[key], b[key])) {
      obj[key] = b[key];
    }
  }

  return obj;
};

export const deepDiff = (a, b) => {
  if (typeof a === 'object' && typeof b === 'object') {
    let obj;
    if (b instanceof Array) {
      obj = [];
    } else {
      obj = {};
    }
    for (const key in b) {
      if (!equals(a[key], b[key])) {
        // console.log(a[key], b[key]);
        obj[key] = deepDiff(a[key], b[key]);
      }
    }
    // if (b.id && !) {
    //   obj.id = b.id;
    // }
    return obj;
  } else {
    return `${a} => ${b}`;
  }
};

export const equals = (a, b) => {
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    for (const key of aKeys) {
      if (a[key] !== b[key]) {
        return false;
      }
    }

    return true;
  } else {
    return a === b;
  }
}

export const registerEntity = Type => {
  setTimeout(() => {
    WM.registerEntity(Type);
  }, 1);
};

export const sizeOf = object => {
  if (typeof object === 'object') {
    let size = 0;
    for (const key in object) {
      size += sizeOf(object[key]);
    }
    return size;
  } else {
    return 1;
  }
};