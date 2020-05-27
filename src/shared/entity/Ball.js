import Entity from "./Entity";
import Rectangle from "../util/Rectangle";

class Ball extends Entity {
  constructor() {
    super();
    this.type = "Ball";
    this.friction = 0.05;
    this.bounce = 0.8;
    this.setBounds(new Rectangle(0, 0, 30, 30));
    this.registerHandler("OBJECT_COLLISION", (event) => {
      const { entity1, entity2 } = event;
      if (entity1 && entity2) {
        if (entity1.id === this.id) {
          entity2.applyForce(this.velocity);
        }
      }
    });
  }

  initializeGraphics(two) {
    const circle = two.makeCircle(this.position.x, this.position.y, 15);
    circle.linewidth = 5;
    this.graphicsObject = circle;
    this.setColor(this.color);
  }
}

export default Ball;
