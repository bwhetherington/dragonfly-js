import PickUp from './PickUp';
import { registerEntity } from '../util/util';

const WEAPON_COLORS = {
  Raygun: {
    red: 200,
    green: 50,
    blue: 50
  },
  Shotgun: {
    red: 200,
    green: 150,
    blue: 0
  },
  default: {
    red: 100,
    green: 100,
    blue: 100
  }
};

class WeaponPickUp extends PickUp {
  constructor(type) {
    super();
    this.setWeaponType(type);
  }

  serialize() {
    return {
      ...super.serialize(),
      weaponType: this.weaponType
    };
  }

  deserialize(obj) {
    if (super.deserialize(obj)) {
      if (obj.weaponType) {
        this.setWeaponType(obj.weaponType);
      }
      return true;
    } else {
      return false;
    }
  }

  onPickUp(hero) {
    if (this.weaponType) {
      hero.setWeapon(this.weaponType);
    }
  }

  initializeGraphics(two) {
    super.initializeGraphics(two);
    const color = WEAPON_COLORS[this.weaponType] || WEAPON_COLORS.default;
    this.setColor(color);
  }

  setWeaponType(type) {
    if (type) {
      this.weaponType = type;
      const color = WEAPON_COLORS[type] || WEAPON_COLORS.default;
      this.setColor(color);
    }
  }
}

registerEntity(WeaponPickUp);

export default WeaponPickUp;