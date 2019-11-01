class SizedQueue {
  constructor(size) {
    this.maxSize = size;
    this.size = 0;
    this.head = null;
    this.tail = null;
    this.isEmptyInternal = true;
  }

  enqueue(obj) {
    const node = {
      next: null,
      prev: this.tail,
      value: obj
    };
    if (this.tail) {
      this.tail.next = node;
    } else {
      this.head = node;
      this.isEmptyInternal = false;
    }
    this.tail = node;
    this.size += 1;
    if (this.size > this.maxSize) {
      this.size -= 1;
      return this.dequeue();
    } else {
      return null;
    }
  }

  dequeue() {
    if (this.head) {
      const value = this.head.value;
      this.head = this.head.next;
      if (this.head === null) {
        this.tail = null;
        this.isEmptyInternal = true;
      }
      this.size -= 1;
      return value;
    } else {
      return null;
    }
  }

  get isEmpty() {
    return this.isEmptyInternal;
  }
}

const queue = new SizedQueue(2);

queue.enqueue(1);
queue.enqueue(2);
queue.enqueue(3);

while (!queue.isEmptyInternal) {
  console.log(queue.dequeue());
}

queue.enqueue(2);
console.log(queue.dequeue());

