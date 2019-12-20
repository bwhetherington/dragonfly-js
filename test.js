function isIterable(obj) {
  if (obj === null || obj === undefined) {
    return false;
  }

  return typeof obj[Symbol.iterator] === "function";
}

function* flatten(obj) {
  if (isIterable(obj)) {
    for (const x of obj) {
      yield* flatten(x);
    }
  } else {
    yield obj;
  }
}

const obj = [[1, 2, 3], 4, [5, 6, 7], [8, [9, 10]]];

console.log(Array.from(flatten(obj)));
