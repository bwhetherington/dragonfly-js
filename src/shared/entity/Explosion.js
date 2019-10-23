import Entity from "./Entity";
import Rectangle from "../util/Rectangle";
import AM from "../audio/AudioManager";

const DURATION = 0.5;
const MIN_SIZE = 0;
const MAX_SIZE = 1;
const BORDER_SIZE = 10;

class Explosion extends Entity {
  constructor() {
    super();
    this.timer = 0;
    this.isCollidable = false;
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

    AM.playSound('explode.wav', 0.1);
  }

  updateSize() {
    if (this.graphicsObject) {
      const progress = this.timer / DURATION;
      const scale = MIN_SIZE + (progress * (MAX_SIZE - MIN_SIZE));
      this.graphicsObject.scale = scale;
      if (progress > 0) {
        this.graphicsObject.linewidth = BORDER_SIZE / (progress * 0.75);
      }
    }
  }

  getColor() {
    const progress = this.timer / DURATION;
    const opacity = 0.5 * (1 - progress);
    return 'rgba(200, 150, 50, ' + opacity + ')';
  }

  initializeGraphics(two) {
    const circle = two.makeCircle(this.position.x, this.position.y, 15);

    circle.fill = 'rgba(200, 150, 50, 0.8)';
    circle.stroke = 'rgba(150, 100, 25, 0.6)';
    circle.linewidth = BORDER_SIZE;

    this.graphicsObject = circle;
    this.updateSize();
  }
}

export default Explosion;