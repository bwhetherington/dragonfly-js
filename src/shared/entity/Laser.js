import Entity from "./Entity";
import Vector from "../util/Vector";
import Rectangle from '../util/Rectangle';
import { registerEntity, color } from "../util/util";

const DURATION = 0.375;

const DEFAULT_COLOR = color(200, 50, 50);

class Laser extends Entity {
  constructor(p1, p2) {
    super();
    this.timer = 0;
    this.isCollidable = false;
    this.doSynchronize = false;
    this.boundingBox = new Rectangle(0, 0, 0, 0);

    this.p1 = new Vector();
    this.p2 = new Vector();

    this.p1.set(p1);
    this.p2.set(p2);

    this.registerHandler('STEP', event => {
      const { dt } = event;
      this.timer += dt;
      this.updateSize();
      if (this.timer >= DURATION) {
        this.markForDelete();
      }
    });

    // AM.playSound('fire.wav', 0.1);
  }

  updateSize() {
    if (this.graphicsObject) {
      const progress = Math.min(1, this.timer / DURATION);
      this.graphicsObject.opacity = (1 - progress) * 0.7;
    }
  }

  updatePosition() { }

  initializeGraphics(two) {
    const { p1, p2 } = this;

    const dist = this.p1.distance(this.p2);
    const angle = this.p1.angleTo(this.p2);

    const x = (p1.x + p2.x) / 2;
    const y = (p1.y + p2.y) / 2;

    const rect = two.makeRectangle(x, y, dist, 10);
    rect.rotation = angle;
    rect.linewidth = 5;

    this.graphicsObject = rect;
    this.setColor(DEFAULT_COLOR);
  }
}

registerEntity(Laser);

export default Laser;