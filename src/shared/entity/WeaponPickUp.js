import PickUp from './PickUp';

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
    super.deserialize(obj);
    if (obj.weaponType) {
      this.setWeaponType(obj.weaponType);
    }
  }

  onPickUp(hero) {
    if (this.weaponType) {
      hero.setWeapon(this.weaponType);
    }
  }

  setWeaponType(type) {
    this.weaponType = type;
    const color = WEAPON_COLORS[type] || WEAPON_COLORS.default;
    this.setColor(color);
  }
}

export default WeaponPickUp;