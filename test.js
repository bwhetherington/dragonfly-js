const deepDiff = (a, b) => {
  if (typeof a === 'object' && typeof b === 'object') {
    let obj;
    if (b instanceof Array) {
      obj = [];
    } else {
      obj = {};
    }
    for (const key in b) {
      if (!equals(a[key], b[key])) {
        obj[key] = deepDiff(a[key], b[key]);
      }
    }
    if (b.id) {
      obj.id = b.id;
    }
    return obj;
  } else {
    return b;
  }
};

const equals = (a, b) => {
  if (typeof a === 'object' && typeof b === 'object') {
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
}

const a = [{
  position: { x: 10, y: 20 }
}];

const b = [{
  position: { x: 10, y: 21 }
}];

console.log(deepDiff(a, b));