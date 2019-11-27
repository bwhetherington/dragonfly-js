import GM from "../event/GameManager";

const format = (items = []) => {
  let output = '';
  for (const arg of items) {
    if (typeof arg === 'object') {
      output += '<pre><code>' + JSON.stringify(arg, null, 2) + '</code></pre>';
    } else {
      output += arg;
    }
    output += ' ';
  }
  console.log(output);
  return output;
};

class NetworkManager {
  constructor() {
    this.node = null;
  }

  initialize(node) {
    this.node = node;
  }

  messageClients(...items) {
    console.log(items);
    const message = {
      author: 'Server',
      content: format(items),
      id: -1,
      time: Date.now()
    };
    this.send({
      type: 'CHAT_OUTPUT',
      data: {
        message
      }
    });
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