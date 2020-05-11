import Weapon from "./Weapon";
import { iterator } from "lazy-iters";
import WM from "./WorldManager";
import Vector from "../util/Vector";
import { color } from "../util/color";
import GM from "../event/GameManager";
import AM from "../audio/AudioManager";

const COLOR = color(200, 150, 50);

class Mortar extends Weapon {
  constructor() {
    super("Mortar", 1, false);
    this.damage = 35;
    this.radius = 60;
  }

  fire(fx, fy, sourceHero) {
    const point = new Vector(fx, fy);

    // Get distance
    const dist = point.distance(sourceHero.position);
    const time = dist / 450;

    // Show shadow
    const event = {
      type: "CREATE_SHADOW",
      data: {
        position: point.serialize(),
        duration: time,
        radius: this.radius,
      },
    };
    GM.emitEvent(event);

    // Run an explosion after a delay
    sourceHero.runDelay(time, () => {
      // Show explosion
      const event = {
        type: "CREATE_EXPLOSION",
        data: {
          position: point.serialize(),
          color: COLOR,
          radius: this.radius,
        },
      };
      GM.emitEvent(event);

      // Damage entities
      iterator(WM.getEntitiesByRadius(point, this.radius))
        // .filter(entity => entity.id !== sourceHero.id)
        .forEach((entity) => entity.damage(this.damage, sourceHero));
    });

    AM.playSound("fire.wav", 0.125, sourceHero.position.clone());
  }

  renderTooltip() {
    return {
      ...super.renderTooltip(),
      Radius: this.radius,
    };
  }
}

export default Mortar;
