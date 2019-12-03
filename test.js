const rand = (scale = 1) => scale * (Math.random() - 0.5);

const generateSprayPattern = (scale = 1) => {
  let value = 0;
  const spray = [];

  for (let i = 0; i < 100; i++) {
    const num = rand(scale);
    if (Math.abs(value + num) > Math.abs(value)) {
      value += num * 0.67;
    } else {
      value += num;
    }
    spray.push(value);
  }

  return spray;
};

console.log(JSON.stringify(generateSprayPattern()));