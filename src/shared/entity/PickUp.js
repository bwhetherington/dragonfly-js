import Entity from "./Entity";
import Rectangle from "../util/Rectangle";
import { isServer, registerEntity } from "../util/util";
import Hero from "./Hero";
import GM from "../event/GameManager";

class PickUp extends Entity {
  constructor() {
    super();
    this.type = "PickUp";
    this.boundingBox = new Rectangle(0, 0, 20, 20);
    this.isCollidable = false;
    this.isSpectral = true;
    this.opacity = 0.5;
    this.timer = 1;
    this.isSpawned = false;

    if (isServer()) {
      this.registerHandler("STEP", event => {
        if (!this.isSpawned) {
          this.timer = Math.max(0, this.timer - event.dt);
          if (this.timer === 0) {
            this.spawn();
          }
        }
      });

      this.registerHandler("OBJECT_COLLISION", event => {
        const { object1, object2 } = event;
        let other = null;
        if (object1.id === this.id) {
          if (object2.id !== this.sourceID && object2 instanceof Hero) {
            other = object2;
          }
        } else if (object2.id === this.id) {
          if (object1.id !== this.sourceID && object1 instanceof Hero) {
            other = object1;
          }
        }
        if (other !== null && this.shouldPickUp(other)) {
          this.onPickUp(other);
          this.markForDelete();
        }
      });
    }
  }

  serialize() {
    return {
      ...super.serialize(),
      timer: this.timer,
      isSpawned: this.isSpawned
    };
  }

  deserialize(obj) {
    if (super.deserialize(obj)) {
      const { timer, isSpawned } = obj;
      if (timer !== undefined) {
        this.timer = timer;
        if (!this.isSpawned && timer === 0) {
          this.spawn();
        }
      }
      if (isSpawned !== undefined) {
        if (!this.isSpawned && isSpawned) {
          this.spawn();
        }
      }
      return true;
    } else {
      return false;
    }
  }

  spawn() {
    this.isCollidable = true;
    this.isSpawned = true;
    this.updateOpacity(1);
  }

  initializeGraphics(two) {
    const square = two.makeRoundedRectangle(
      this.position.x,
      this.position.y,
      20,
      20,
      4
    );
    square.linewidth = 5;
    this.graphicsObject = square;
  }

  shouldPickUp(hero) {
    return true;
  }

  onPickUp(hero) {}
}

export default PickUp;
