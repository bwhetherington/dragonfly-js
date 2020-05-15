import Weapon from "./Weapon";
import WM from "./WorldManager";
import AM from "../audio/AudioManager";
import GM from "../event/GameManager";
import Ray from "./Ray";
import { color } from "../util/color";
import Vector from "../util/Vector";
import Explosion from "./Explosion";
import NM from "../network/NetworkManager";

class Raygun extends Weapon {
  constructor() {
    super("Raygun", 1, false);
    this.useTimeWarp = true;
    this.damage = 25;
    this.color = color(200, 0, 0);
  }

  fire(fx, fy, sourceHero) {
    AM.playSound("fire.wav", 0.125, sourceHero.position.clone());

    const start = new Vector(fx, fy);
    start.subtract(sourceHero.position);
    start.normalize();
    start.scale(30);
    start.add(sourceHero.position);
    const { x, y } = start;
    start.setXY(fx, fy);
    start.subtract(sourceHero.position);
    start.normalize();

    WM.raycast(x, y, 10, start, [sourceHero.id], (pos, target) => {
      const event = {
        type: "CREATE_RAY",
        data: {
          source: sourceHero.id,
          start: {
            x,
            y,
          },
          end: {
            x: pos.x,
            y: pos.y,
          },
        },
      };

      GM.emitEvent(event);

      if (target) {
        target.damage(this.damage, sourceHero.id);
      }
    });

    // const ray = new Ray(sourceHero.id);
    // WM.add(ray);
    // ray.position.set(sourceHero.position);
    // ray.castRay({ x: fx, y: fy });
    // ray.registerHandler("HIT_OBJECT", (event) => {
    //   const { hitID, sourceID, projectileID } = event;
    //   if (projectileID === ray.id) {
    //     const object = WM.findByID(hitID);
    //     if (object) {
    //       object.damage(this.damage, sourceID);
    //     }
    //   }
    // });
  }
}

export default Raygun;
