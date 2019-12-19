import PickUp from "./PickUp";
import { registerEntity, color } from "../util/util";
import Hero from "./Hero";

const WEAPON_COLORS = {
  Raygun: color(200, 50, 50),
  Shotgun: color(200, 150, 0),
  Rocket: color(100, 200, 255),
  Madsen: color(200, 200, 80),
  default: color(100, 100, 100)
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

  shouldPickUp(hero) {
    if (hero instanceof Hero) {
      return hero.weapon && hero.weapon.type === "Pistol";
    } else {
      return false;
    }
  }
}

export default WeaponPickUp;
