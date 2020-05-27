class Timer {
  constructor(callback) {
    this.callback = callback;
    this.lastTime = 0;
    this.frame = 0;
    this.onFrame = (time) => {
      const dt = (time - this.lastTime) / 1000;
      // console.log(dt);
      if (this.frame % 1 === 0) {
        this.callback(dt);
        this.lastTime = time;
      }
      this.frame += 1;
      requestAnimationFrame(this.onFrame);
    };
  }

  stop() {
    cancelAnimationFrame();
  }

  start() {
    requestAnimationFrame(this.onFrame);
  }
}

export default Timer;
