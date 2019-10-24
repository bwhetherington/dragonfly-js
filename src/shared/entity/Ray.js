import Entity from "./Entity";
import WM from "./WorldManager";
import Rectangle from "../util/Rectangle";
import Vector from "../util/Vector";
import GM from "../event/GameManager";

class Ray extends Entity {
  constructor(sourceID = null) {
    super();
    this.sourceID = sourceID;
    this.doSynchronize = false;
    this.boundingBox = new Rectangle(0, 0, 10, 10);
    this.registerHandler('CAST_RAY', event => {
      const { id, target } = event;
      if (id === this.id) {
        this.castRay(target);
      }
    });
  }

  castRay(target) {
    this.velocity.set(target);
    this.velocity.subtract(this.position);
    this.velocity.normalize();
    this.velocity.scale(40);

    this.position.add(this.velocity);

    const start = new Vector(0, 0);
    start.set(this.position);

    // Move this until it collides
    while (!WM.move(this, 0.1)) {
      // console.log(this.position);
    };
    this.markForDelete();

    const end = this.position;

    const event = {
      type: 'CREATE_RAY',
      data: {
        start: {
          x: start.x,
          y: start.y
        },
        end: {
          x: end.x,
          y: end.y
        }
      }
    };
    GM.emitEvent(event);
  }
}

export default Ray;