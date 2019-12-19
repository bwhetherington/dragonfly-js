import Weapon from "./Weapon";
import WM from "./WorldManager";
import AM from "../audio/AudioManager";
import Ray from "./Ray";
import { color } from "../util/util";

class Raygun extends Weapon {
  constructor() {
    super("Raygun", 1, false);
    this.useTimeWarp = true;
    this.damage = 25;
    this.color = color(200, 0, 0);
  }

  fire(fx, fy, sourceHero) {
    AM.playSound("fire.wav", 0.125, sourceHero.position.clone());
    const ray = new Ray(sourceHero.id);
    WM.add(ray);
    ray.position.set(sourceHero.position);
    ray.castRay({ x: fx, y: fy });
    ray.registerHandler("HIT_OBJECT", event => {
      const { hitID, sourceID, projectileID } = event;
      if (projectileID === ray.id) {
        const object = WM.findByID(hitID);
        if (object) {
          object.damage(this.damage, sourceID);
        }
      }
    });
  }
}

export default Raygun;
