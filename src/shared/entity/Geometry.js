import Entity from "./Entity";
import { CollisionGroup } from "./util";
import { color, getFill } from "../util/color";
import InverseRectangle from "../util/InverseRectangle";
import Rectangle from "../util/Rectangle";

const GEOM_COLOR = color(220, 220, 220);
const GEOM_FILL = getFill(GEOM_COLOR);

const createShape = (shape) => {
  const { type, x, y, width, height } = shape;
  switch (type) {
    case "InverseRectangle":
      return new InverseRectangle(x, y, width, height);
    case "Rectangle":
      return new Rectangle(x, y, width, height);
  }
};

class Geometry extends Entity {
  constructor() {
    super();
    this.type = "Geometry";
    this.collisionGroup = CollisionGroup.GEOMETRY;
    this.setColor(GEOM_COLOR);
  }

  setShape(shape) {
    // console.log(shape);
    this.shape = shape;
    this.setBounds(shape);
    if (this.graphicsObject) {
      console.log("has graphics");
      this.graphicsObject.width = shape.width;
      this.graphicsObject.height = shape.height;
      if (shape instanceof InverseRectangle) {
        console.log("hello");
        this.graphicsObject.stroke = "white";
        this.graphicsObject.fill = "blue";
        document.getElementById("game").style.background = GEOM_FILL;
      }
    }
  }

  serialize() {
    return {
      ...super.serialize(),
      shape: this.shape,
    };
  }

  deserialize(obj) {
    super.deserialize(obj);
    const { shape } = obj;
    if (shape) {
      const bounds = createShape(shape);
      this.setShape(bounds);
    }
  }

  applyForce(force) {
    // Do nothing
  }

  damage(amount, source) {
    // Do nothing
  }

  initializeGraphics(two) {
    this.two = two;
    let width = 30;
    let height = 30;
    if (this.shape) {
      width = this.shape.width;
      height = this.shape.height;
    }
    const object = two.makeRectangle(0, 0, width, height);
    object.linewidth = 5;
    this.graphicsObject = object;
    if (this.graphicsObject) {
      this.graphicsObject.opacity = this.opacity;
    }
  }

  setColor(color) {
    super.setColor(color);
    if (this.shape && this.graphicsObject) {
      if (this.shape instanceof InverseRectangle) {
        const { fill } = this.graphicsObject;
        this.graphicsObject.fill = "rgba(0, 0, 0, 0)";
        document.getElementById("game").style.backgroundColor = fill;
      }
    }
  }
}

export default Geometry;
