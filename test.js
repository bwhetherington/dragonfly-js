const diff = (a, b) => {
  const obj = {};

  for (const key in b) {
    if (!equals(a[key], b[key])) {
      obj[key] = b[key];
    }
  }

  return obj;
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