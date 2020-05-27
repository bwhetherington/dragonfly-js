import WM from "../entity/WorldManager";
import GM from "../event/GameManager";
import Vector from "./Vector";
import short from "short-uuid";

export const Corner = {
  TOP_LEFT: 0,
  TOP_RIGHT: 1,
  BOTTOM_LEFT: 2,
  BOTTOM_RIGHT: 3,
};

const uuidGenerator = short();

export const uuid = () => uuidGenerator.generate();

let isServerInternal = false;

export const setServer = () => {
  isServerInternal = true;
};

export const setClient = () => {
  isServerInternal = false;
};

export const isClient = () => !isServerInternal;

export const isServer = () => isServerInternal;

export const initializeInput = (heroGetter) => {
  GM.registerHandler("KEY_DOWN", (event) => {
    const hero = heroGetter(event.socketIndex);
    switch (event.key) {
      case "KeyW":
        hero.setInput("up", true);
        break;
      case "KeyS":
        hero.setInput("down", true);
        break;
      case "KeyA":
        hero.setInput("left", true);
        break;
      case "KeyD":
        hero.setInput("right", true);
        break;
      case "KeyF":
        hero.applyForce(new Vector(100, 0));
        break;
      case "KeyQ":
        hero.setWeapon("Pistol");
        break;
    }
  });
  GM.registerHandler("KEY_UP", (event) => {
    const hero = heroGetter(event.socketIndex);
    switch (event.key) {
      case "KeyW":
        hero.setInput("up", false);
        break;
      case "KeyS":
        hero.setInput("down", false);
        break;
      case "KeyA":
        hero.setInput("left", false);
        break;
      case "KeyD":
        hero.setInput("right", false);
        break;
    }

    // console.log(hero);
  });
};

export const diff = (a, b) => {
  const obj = {};

  for (const key in b) {
    if (!equals(a[key], b[key])) {
      obj[key] = b[key];
    }
  }

  return obj;
};

const isEmpty = (obj) => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
};

export const pruneEmpty = (obj) => {
  if (typeof obj === "object") {
    for (const key in obj) {
      if (isEmpty(obj[key])) {
        delete obj[key];
      } else {
        pruneEmpty(obj[key]);
      }
    }
  }
};

export const deepDiff = (a, b, keepProperties = []) => {
  if (typeof a === "object" && typeof b === "object") {
    let obj;
    let isDifferent = false;

    if (b instanceof Array) {
      obj = [];
    } else {
      obj = {};
    }

    for (const key in b) {
      if (!equals(a[key], b[key])) {
        const diff = deepDiff(a[key], b[key], keepProperties);
        if (!isEmpty(diff)) {
          isDifferent = true;
          obj[key] = diff;
        }
      }
    }

    if (isDifferent) {
      for (const key of keepProperties) {
        if (b.hasOwnProperty(key)) {
          obj[key] = b[key];
        }
      }
    }

    return obj;
  } else {
    return {
      from: a,
      to: b,
    };
  }
};

export const equals = (a, b) => {
  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    for (const key of aKeys) {
      if (a[key] !== b[key]) {
        return false;
      }
    }

    return true;
  } else {
    return a === b;
  }
};

export const registerEntity = (Type) => {
  setTimeout(() => {
    WM.registerEntity(Type);
  }, 1);
};

export const sizeOf = (object) => {
  if (typeof object === "object") {
    let size = 0;
    for (const key in object) {
      size += sizeOf(object[key]);
    }
    return size;
  } else {
    return 1;
  }
};

const ensureString = (value) => {
  if (typeof value !== "string") {
    if (value === undefined) {
      return "undefined";
    } else if (value === null) {
      return "null";
    } else {
      return value.toString();
    }
  } else {
    return value;
  }
};

const line = (content, depth = 0) => {
  content = ensureString(content);

  const lines = [];

  for (const line of content.split("\n")) {
    let lineOutput = "";
    for (let i = 0; i < depth * 2; i++) {
      lineOutput += " ";
    }
    lineOutput += line;
    lines.push(lineOutput);
  }

  return lines.join("\n");
};

const formatArray = (arr, depth = 0) => {
  let content = "";
  if (arr.length > 0) {
    content += line("[", depth) + "\n";

    // Each item besides the first should have a comma
    for (let i = 0; i < arr.length - 1; i++) {
      content += formatJSON(arr[i], depth + 1) + ",\n";
    }

    // Final item should not have comma
    content += formatJSON(arr[arr.length - 1], depth + 1) + "\n";

    content += line("]", depth);
  } else {
    content += line("[]");
  }
  return content;
};

const isDiff = (obj) => {
  const keys = Object.keys(obj);
  if (keys.length === 2) {
    const [a, b] = keys;
    return (a === "from" && b === "to") || (a === "to" && b === "from");
  } else {
    return false;
  }
};

const formatDiff = ({ from, to }, depth = 0) =>
  line(`${formatJSON(from)} => ${formatJSON(to)}`, depth);

const formatObject = (obj, depth = 0) => {
  if (isDiff(obj)) {
    return formatDiff(obj, depth);
  }
  const { type, ...rest } = obj;
  const keys = Object.keys(rest);
  let content = "";
  if (keys.length > 0) {
    if (type) {
      content += line(type + " {", depth) + "\n";
    } else {
      content += line("{", depth) + "\n";
    }

    // Each item besides the first should have a comma
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const keyDisplay = isIdentifier(key) ? key : '"' + key + '"';
      content +=
        line(keyDisplay + ": " + formatJSON(rest[key], 0), depth + 1) + ",\n";
    }

    // Final item should not have comma
    const key = keys[keys.length - 1];
    const keyDisplay = isIdentifier(key) ? key : '"' + key + '"';
    content +=
      line(keyDisplay + ": " + formatJSON(rest[key], 0), depth + 1) + "\n";

    content += line("}", depth);
  } else {
    if (type) {
      content += line(type + " {}", depth);
    } else {
      content += line("{}", depth);
    }
  }
  return content;
};

export const formatJSON = (obj, depth = 0) => {
  if (typeof obj === "object") {
    if (obj instanceof Array) {
      return formatArray(obj, depth);
    } else {
      return formatObject(obj, depth);
    }
  } else if (typeof obj === "number") {
    return line(round(obj, 2), depth);
  } else if (typeof obj === "string") {
    return line('"' + obj + '"', depth);
  } else {
    return line(obj, depth);
  }
};

export const round = (number, places = 0) => {
  const multiplier = 10 ** places;
  return Math.round(number * multiplier) / multiplier;
};

export const isIdentifier = (str) => {
  try {
    eval("let " + str + ";");
    return true;
  } catch (_) {
    return false;
  }
};

const isIterable = (obj) => {
  if (obj === null || obj === undefined) {
    return false;
  }

  return typeof obj[Symbol.iterator] === "function";
};

export function* flatten(obj) {
  if (isIterable(obj)) {
    for (const x of obj) {
      yield* flatten(x);
    }
  } else {
    yield obj;
  }
}

export const randomInt = (min, max) => {
  const diff = max - min;
  return Math.floor(Math.random() * diff) + min;
};

const M = 29.2 / 5;

export const calculateAcceleration = (speed, friction) => {
  // s = acc - (acc/350) * m * f
  // s/acc = 1 - m*f/350
  // s / (1 - (m*f)/350) = acc
  return speed / (1 - (M * friction) / 350);
};

const l10 = Math.log(10);

const getPlaces = (num) => {
  return Math.ceil(Math.log(num) / l10);
};

// export const sigFigRound = (num, sigFigs) => {
//   const places =
// };
