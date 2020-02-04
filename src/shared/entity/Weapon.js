import GM from "../event/GameManager";
import NM from "../network/NetworkManager";
import { isServer, isClient } from "../util/util";

class Weapon {
  constructor(name = "Weapon", delayAmount = 0.5, isAutomatic = false) {
    this.delayTimer = 0;
    this.delayAmount = delayAmount;
    this.name = name;
    this.useTimeWarp = false;
    this.isActive = false;
    this.isAutomatic = isAutomatic;
    this.damage = 1;
    this.type = name;
  }

  /**
   * Since a weapon is not an entity, we must rely on its owning entity to step
   * it.
   * @param dt
   */
  step(dt, sourceHero = null) {
    if (this.delayTimer !== 0) {
      this.delayTimer = Math.max(this.delayTimer - dt, 0);
    }

    // If it is automatic, attempt to fire
    if (
      sourceHero &&
      this.isAutomatic &&
      this.delayTimer === 0 &&
      this.isActive
    ) {
      // Calculate target from cannon angle
      const { cannonAngle } = sourceHero;
      const offsetX = Math.cos(cannonAngle - Math.PI / 2);
      const offsetY = Math.sin(cannonAngle - Math.PI / 2);
      this.fire(
        sourceHero.position.x + offsetX,
        sourceHero.position.y + offsetY,
        sourceHero
      );
      this.delayTimer = this.delayAmount;
      this.fireEvent(sourceHero);
    }
  }

  start() {
    this.isActive = true;
  }

  stop() {
    this.isActive = false;
  }

  serialize() {
    return {
      type: this.type,
      name: this.name,
      delayTimer: this.delayTimer,
      delayAmount: this.delayAmount,
      isAutomatic: this.isAutomatic,
      isActive: this.isActive,
      damage: this.damage
    };
  }

  deserialize(obj) {
    const { delayTimer, delayAmount, isAutomatic, isActive, damage } = obj;
    if (delayTimer !== undefined) {
      this.delayTimer = delayTimer;
    }
    if (delayAmount !== undefined) {
      this.delayAmount = delayAmount;
    }
    if (isAutomatic !== undefined) {
      this.isAutomatic = isAutomatic;
    }
    if (isActive !== undefined) {
      this.isActive = isActive;
    }
    if (damage !== undefined) {
      this.damage = damage;
    }
  }

  cleanup() {}

  fireEvent(sourceHero) {
    const fireEvent = {
      type: "FIRE_WEAPON",
      data: {
        id: sourceHero.id
      }
    };
    if (!GM.rollback && isServer()) {
      NM.send(fireEvent);
    } else if (isClient()) {
      GM.emitEvent(fireEvent);
    }
  }

  fireInternal(fx, fy, sourceHero) {
    if (!this.automatic) {
      if (this.delayTimer <= 0) {
        this.fire(fx, fy, sourceHero);
        this.delayTimer = this.delayAmount;
        this.fireEvent(sourceHero);
      }
    } else {
      this.step(0, sourceHero);
    }
  }

  fire(fx, fy, sourceHero) {}

  renderTooltip() {
    return {
      Rate: this.delayAmount,
      Damage: this.damage
    };
  }
}

export default Weapon;
