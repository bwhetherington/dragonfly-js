const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

const parseFile = file => {
  return file.split('\n')
    .filter(str => str.length > 0)
    .map(JSON.parse);
};

const main = async argv => {
  const [_, name, ...args] = argv;
  for (const arg of args) {
    const file = await readFile(arg, 'utf-8');
    console.log(parseFile(file).filter(event => event.data.type !== 'STEP' && event.data.type !== 'ROTATE_CANNON').map(event => event.data.data));
  }
};

main(process.argv).catch(console.log);

