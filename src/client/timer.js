class Timer {
  constructor(callback) {
    this.callback = callback;
    this.lastTime = 0;
    this.onFrame = time => {
      const dt = (time - this.lastTime) / 1000;
      this.callback(dt);
      this.lastTime = time;
      requestAnimationFrame(this.onFrame);
    }
  }

  stop() {
    cancelAnimationFrame();
  }

  start() {
    requestAnimationFrame(this.onFrame);
  }
}

export default Timer;