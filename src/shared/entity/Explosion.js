import Entity from "./Entity";
import Rectangle from "../util/Rectangle";
import AM from "../audio/AudioManager";
import WM from "./WorldManager";
import { registerEntity, color } from "../util/util";

const DURATION = 0.5;
const BORDER_SIZE = 10;

const CENTER_SIZE = 5;

const DEFAULT_COLOR = color(200, 150, 50);

class Explosion extends Entity {
  constructor(color = DEFAULT_COLOR, radius = 5) {
    super();
    this.radius = radius;
    this.color = color;
    this.timer = 0;
    this.isCollidable = false;
    this.isSpectral = true;
    this.doSynchronize = false;
    this.boundingBox = new Rectangle(0, 0, 0, 0);

    this.registerHandler('STEP', event => {
      const { dt } = event;
      this.timer += dt;
      this.updateSize();
      if (this.timer >= DURATION) {
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
    if (this.graphicsObject) {
      const progress = Math.min(1, this.timer / DURATION);
      const scale = (progress * this.radius) / CENTER_SIZE;
      this.graphicsObject.scale = scale;
      if (progress > 0) {
        this.graphicsObject.linewidth = CENTER_SIZE / scale * 2.5;
        this.graphicsObject.opacity = (1 - progress) * 0.7;
      }
    }
  }

  initializeGraphics(two) {
    const circle = two.makeCircle(this.position.x, this.position.y, CENTER_SIZE);
    circle.scale = 0;
    circle.opacity = 0;
    circle.linewidth = BORDER_SIZE;

    this.graphicsObject = circle;
    this.setColor(this.color);
    this.updateSize();

    AM.playSound('explode.wav', 0.25, this.position.clone());
  }
}

registerEntity(Explosion);

export default Explosion;