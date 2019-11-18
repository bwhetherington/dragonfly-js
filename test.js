const sizeOf = object => {
  if (typeof object === 'object') {
    let size = 0;
    for (const key in object) {
      size += sizeOf(object[key]);
    }
    return size;
  } else {
    return 1;
  }
};

