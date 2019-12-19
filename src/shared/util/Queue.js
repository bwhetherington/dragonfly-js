// class Queue {
//   constructor() {
//     this.items = [];
//   }

//   enqueue(element) {
//     this.items.push(element);
//   }

//   dequeue() {
//     return this.items.shift();
//   }
// }

import SizedQueue from "./SizedQueue";

class Queue extends SizedQueue {
  constructor() {
    super(Number.POSITIVE_INFINITY);
  }
}

export default Queue;
