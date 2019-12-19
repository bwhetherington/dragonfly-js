import Entity from "./Entity";
import Rectangle from "../util/Rectangle";
import AM from "../audio/AudioManager";
import WM from "./WorldManager";
import { registerEntity, color } from "../util/util";

const BORDER_SIZE = 10;

const CENTER_SIZE = 5;

const DEFAULT_COLOR = color(200, 150, 50);

class Shadow extends Entity {
  constructor(duration = 0.5, radius = 5) {
    super();
    this.duration = duration;
    this.radius = radius;
    this.timer = 0;
    this.isCollidable = false;
    this.isSpectral = true;
    this.doSynchronize = false;
    this.boundingBox = new Rectangle(0, 0, 0, 0);

    this.registerHandler("STEP", event => {
      const { dt } = event;
      this.timer += dt;
      this.updateSize();
      if (this.timer >= this.duration) {
        this.markForDelete();
      }
    });
  }

  serialize() {
    return {
      ...super.serialize(),
      radius: this.radius,
      color: this.color
    };
  }

  deserialize(obj) {
    if (super.deserialize(obj)) {
      const { color, radius } = obj;
      if (color) {
        this.color = color;
      }
      if (radius !== undefined) {
        this.radius = radius;
      }
      return true;
    } else {
      return false;
    }
  }

  updateSize() {
    if (this.circle) {
      const progress = Math.min(1, this.timer / this.duration);
      const scale = progress * this.radius;
      this.circle.scale = scale;
      // this.circle.fill = "blue";
      // this.circle.scale = 100;
    }
  }

  setColor(color) {
    // Intentionally do nothing
  }

  initializeGraphics(two) {
    const circle = two.makeCircle(0, 0, 1);
    circle.fill = "black";
    circle.scale = 0;
    circle.opacity = 0.3;
    circle.linewidth = 0;
    this.circle = circle;

    const outline = two.makeCircle(0, 0, this.radius);
    outline.fill = "rgba(0, 0, 0, 0)";
    outline.linewidth = 5;
    outline.opacity = 0.3;
    outline.stroke = "black";

    this.graphicsObject = two.makeGroup([outline, circle]);
    console.log(this.graphicsObject);
    this.updateSize();
  }
}

export default Shadow;
