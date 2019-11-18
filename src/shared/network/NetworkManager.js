import GM from "../event/GameManager";

class NetworkManager {
  constructor() {
    this.node = null;
  }

  initialize(node) {
    this.node = node;
  }

  send(packet, index = -1) {
    if (this.node) {
      // Get time from GM
      const time = GM.timeElapsed;
      packet.data.timeElapsed = time;
      this.node.send(packet, index);
    }
  }
}

const NM = new NetworkManager();
export default NM;