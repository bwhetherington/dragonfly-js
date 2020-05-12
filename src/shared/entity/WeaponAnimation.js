import GM from "../event/GameManager";

class WeaponAnimation {
  constructor() {
    this.progress = 0;
    this.id = GM.registerHandler("STEP", (event) => {
      const { dt } = event;
      this.step(dt);
    });
  }

  cleanup() {
    GM.removeHandler("STEP", this.id);
  }

  step(dt) {
    this.progress = Math.max(0, this.progress - dt);
  }

  fire() {
    this.progress = 0.35;
  }

  getProgress() {
    return this.progress * 0.5 + 1;
  }
}

export default WeaponAnimation;
