import Weapon from "./Weapon";
import Vector from "../util/Vector";
import Projectile from "./Projectile";
import WM from "./WorldManager";
import AM from "../audio/AudioManager";
import GM from "../event/GameManager";
import { isServer, color } from "../util/util";

const RADIUS = 100;

const COLOR = color(100, 200, 255);

class Rocket extends Weapon {
  constructor() {
    super("Rocket", 0.75);
    this.damage = 40;
    this.color = COLOR;
  }

  fire(fx, fy, sourceHero) {
    const vector = new Vector(0, 0);
    const offset = new Vector(0, 0);

    // Create direction vector to target
    const { x, y } = sourceHero.position;
    vector.setXY(fx - x, fy - y);
    vector.normalize();

    // vector.addXY(sourceHero.createOffset(0.1), sourceHero.createOffset(0.1));
    // vector.normalize();

    const bullet = new Projectile(sourceHero.id, COLOR, RADIUS);
    bullet.bounce = 0;
    bullet.maxBounces = 0;
    bullet.velocity.set(vector);

    offset.set(vector);
    offset.normalize();
    offset.scale(30);

    bullet.velocity.scale(500);

    bullet.registerHandler("HIT_OBJECT", event => {
      if (isServer()) {
        const { sourceID, projectileID } = event;
        if (projectileID === bullet.id) {
          for (const hitObject of WM.getEntitiesByRadius(
            bullet.position,
            RADIUS
          )) {
            if (!(hitObject.id === projectileID)) {
              hitObject.damage(this.damage, sourceID);
            }
          }
        }
      }
    });
    WM.add(bullet);

    // Position the bullet
    bullet.setPosition(sourceHero.position);
    vector.setXY(fx - x, fy - y);
    vector.normalize();
    vector.scale(30);
    bullet.addPosition(vector);

    AM.playSound("fire.wav", 0.125, sourceHero.position.clone());
  }

  renderTooltip() {
    return {
      ...super.renderTooltip(),
      Radius: RADIUS
    };
  }
}

export default Rocket;
