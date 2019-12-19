import Weapon from "./Weapon";
import { iterator } from "lazy-iters";
import WM from "./WorldManager";
import Vector from "../util/Vector";
import { color } from "../util/util";
import GM from "../event/GameManager";

const COLOR = color(200, 50, 50);

class Mortar extends Weapon {
  constructor() {
    super("Mortar", 1, false);
    this.damage = 35;
    this.radius = 60;
    this.delay = 1;
  }

  fire(fx, fy, sourceHero) {
    const point = new Vector(fx, fy);
    // Show shadow
    const event = {
      type: "CREATE_SHADOW",
      data: {
        position: point.serialize(),
        duration: this.delay,
        radius: this.radius
      }
    };
    GM.emitEvent(event);

    // Run an explosion after a delay
    sourceHero.runDelay(this.delay, () => {
      // Show explosion
      const event = {
        type: "CREATE_EXPLOSION",
        data: {
          position: point.serialize(),
          color: COLOR,
          radius: this.radius
        }
      };
      GM.emitEvent(event);

      // Damage entities
      iterator(WM.getEntitiesByRadius(point, this.radius))
        // .filter(entity => entity.id !== sourceHero.id)
        .forEach(entity => entity.damage(this.damage));
    });
  }

  renderTooltip() {
    return {
      ...super.renderTooltip(),
      Radius: this.radius,
      Delay: this.delay
    };
  }
}

export default Mortar;
