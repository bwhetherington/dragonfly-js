import SizedQueue from "../shared/util/SizedQueue";
import { iterator } from "lazy-iters";

class StressManager {
  constructor() {
    this.queue = new SizedQueue(100);
  }

  addLevel(stress) {
    this.queue.enqueue(stress);
  }

  getStress() {
    return iterator(this.queue.iterateForward()).sum() / this.queue.getSize();
  }
}

const SM = new StressManager();
export default SM;
