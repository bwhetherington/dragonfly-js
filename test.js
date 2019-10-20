const toSeconds = (seconds, nanoseconds) => seconds + nanoseconds * 0.000000001;

const now = () => {
  const [seconds, nanoseconds] = process.hrtime();
  const time = toSeconds(seconds, nanoseconds);
  return time;
}

const wait = time => {
  let start = now();
  let goal = start + time;
  let cur = start;
  while (cur < goal) {
    cur = now();
  }
};

const target = 1.0;

while (true) {
  const start = now();

  // wait()

  wait(0.25);

  // Do stuff
  const end = now();
  const duration = end - start;
  if (duration < target) {
    console.log('sleep', target - duration);
    wait(target - duration);
    console.log(now() - start);
  }
}