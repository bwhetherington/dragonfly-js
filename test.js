const isEmpty = obj => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

const pruneEmpty = obj => {
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (isEmpty(obj[key])) {
        delete obj[key];
      } else {
        pruneEmpty(obj[key]);
      }
    }
  }
}

const obj = {
  '796fc740-0fb4-11ea-99c0-3bde5e03f9bf': {},
  '797174f0-0fb4-11ea-99c0-3bde5e03f9bf': {},
  '79719c01-0fb4-11ea-99c0-3bde5e03f9bf': {},
  '7a138151-0fb4-11ea-99c0-3bde5e03f9bf': {},
  '7ab40711-0fb4-11ea-99c0-3bde5e03f9bf': {},
  '7af8ff50-0fb4-11ea-99c0-3bde5e03f9bf': {},
  '7b58ab81-0fb4-11ea-99c0-3bde5e03f9bf': {},
  '7c8dd020-0fb4-11ea-99c0-3bde5e03f9bf': {}
};

pruneEmpty(obj);

console.log(obj);