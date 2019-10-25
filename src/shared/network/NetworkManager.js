class NetworkManager {
  constructor() {
    this.node = null;
  }

  initialize(node) {
    this.node = node;
  }

  send(packet, index = -1) {
    if (this.node) {
      this.node.send(packet, index);
    }
  }
}

const NM = new NetworkManager();
export default NM;