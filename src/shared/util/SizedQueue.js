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
      } else {
        this.head.prev = null;
      }
      this.size -= 1;
      return value;
    } else {
      return null;
    }
  }

  isEmpty() {
    return this.isEmptyInternal;
  }

  toList() {
    const list = new Array(this.size);
    let current = this.head;
    for (let i = 0; current !== null; i++) {
      const value = current.value;
      list[i] = value;
      current = current.next;
    }
    return list;
  }
}

export default SizedQueue;