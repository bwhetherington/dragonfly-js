const toSeconds = (seconds, nanoseconds) => seconds + nanoseconds * 0.000000001;

const now = () => {
  const [seconds, nanoseconds] = process.hrtime();
  const time = toSeconds(seconds, nanoseconds);
  return time;
}

/**
   * Spins until the amount of time in seconds has passed.
   * @param time 
   */
const wait = time => {
  const start = now();
  const goal = start + time;
  let cur = start;
  while (cur < goal) {
    cur = now();
  }
}

const sleep = time => {
  const ms = time * 1000;
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  })
}

class Timer {
  constructor(interval, callback) {
    this.interval = interval;
    this.callback = callback;
    this.isRunning = false;
  }

  stop() {
    this.isRunning = false;
  }

  async start() {
    this.isRunning = true;
    let start, stop, dt = 0, duration, remaining;
    while (this.isRunning) {
      start = now();
      if (stop !== undefined) {
        dt = start - stop;
      }
      this.callback(dt);
      stop = now();
      duration = stop - start;
      remaining = this.interval - duration;
      if (remaining > 0) {
        // Wait the remainder of the time
        // wait(remaining);
        // console.log(`Frame took ${Math.round(duration * 1000)}ms`);
        await sleep(remaining);
      } else {
        // We can't keep up
        const remainingMS = Math.round(remaining * -1000);
        console.log(`Can't keep up! Frame took an additional ${remainingMS}ms`);
      }
    }
  }
}

export default Timer;