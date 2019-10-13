import { scaleVector, addVector } from '../util';

class GameObject {
  position = [0, 0];
  velocity = [0, 0];
  rotation = 0;
  graphicsEntity = null;

  accelerate(dt) {
    const curVelocity = [...this.velocity];

    // Multiply by dt
    scaleVector(curVelocity, dt);

    // Add to position
    addVector(this.position, curVelocity);
  }

  step(step, dt) {
    this.accelerate(dt);
  }

  updateGraphics() {
    if (this.graphicsEntity) {
      const [x, y] = this.position;
      this.graphicsEntity.position.x = x;
      this.graphicsEntity.position.y = y;
      this.graphicsEntity.rotation = this.rotation;
    }
  }
}

export default GameObject;