class TimerManager {
  constructor() {
    this.timer = null;
    this.isRunning = false;
  }

  initialize(timer) {
    this.timer = timer;
  }

  wake() {
    if (!this.isRunning) {
      if (this.timer) {
        this.timer.start();
      }
      this.isRunning = true;
      console.log("wake timer");
    }
  }

  sleep() {
    if (this.isRunning) {
      if (this.timer) {
        this.timer.stop();
      }
      this.isRunning = false;
      console.log("sleep timer");
    }
  }
}

const TM = new TimerManager();
export default TM;
