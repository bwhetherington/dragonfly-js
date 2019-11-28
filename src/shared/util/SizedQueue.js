class SizedQueue {
  constructor(size) {
    this.maxSize = size;
    this.size = 0;
    this.head = null;
    this.tail = null;
    this.isEmptyInternal = true;
  }

  validateSize() {
    if (this.size > this.maxSize) {
      console.log('size warning');
    }
  }

  getSize() {
    return this.size;
  }

  prepend(obj) {
    const node = {
      next: this.head,
      prev: null,
      value: obj
    };
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;
    this.size += 1;
    this.validateSize();
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
      const old = this.dequeue();
      this.validateSize();
      return old;
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
      this.validateSize();
      return value;
    } else {

      this.validateSize();
      return null;
    }
  }

  push(val) {
    return this.enqueue(val);
  }

  pop() {
    const node = this.tail;
    if (node) {
      this.size -= 1;
      if (node.prev) {
        node.prev.next = null;
        this.tail = node.prev;
      } else {
        this.tail = null;
        this.head = null;
        this.isEmptyInternal = true;
      }

      this.validateSize();
      return node.value;
    } else {

      this.validateSize();
      return null;
    }
  }

  isEmpty() {
    return this.isEmptyInternal;
  }

  toArray() {
    const list = new Array(this.size);
    let current = this.head;
    for (let i = 0; current !== null; i++) {
      const value = current.value;
      list[i] = value;
      current = current.next;
    }
    return list;
  }

  *iterateForward() {
    for (let current = this.head; current; current = current.next) {
      yield current.value;
    }
  }

  *iterateBack() {
    for (let current = this.tail; current; current = current.prev) {
      yield current.value;
    }
  }
}

export default SizedQueue;