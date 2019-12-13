const parseLocation = url => {
  const obj = {};
  const start = url.indexOf('?');
  if (start > 0) {
    const rest = url.substring(start + 1);
    const sections = rest.split('&');
    for (const section of sections) {
      const equals = section.indexOf('=');
      if (equals > 0) {
        const key = decodeURIComponent(section.substring(0, equals));
        const value = decodeURIComponent(section.substring(equals + 1));
        obj[key] = value;
      } else {
        throw new Error('Invalid query argument');
      }
    }
  }
  return obj;
};

const url = 'localhost:3000?foo=bar&baz=Hello%20world!';
console.log(parseLocation(url));