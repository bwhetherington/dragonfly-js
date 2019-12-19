import GM from "../event/GameManager";
import { formatJSON } from "../util/util";

const format = (items = []) => {
  let output = "";
  for (const arg of items) {
    if (typeof arg === "object") {
      output += formatJSON(arg);
    } else {
      output += arg;
    }
    output += " ";
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

  logOptions(items, options = {}) {
    let content;
    if (options.batch) {
      content = items.map(format).join("\n");
    } else {
      content = format(items);
    }
    const message = {
      author: "Server",
      content,
      id: -1,
      time: Date.now(),
      pre: options.pre || false
    };
    this.send({
      type: "CHAT_OUTPUT",
      data: {
        message
      }
    });
  }

  log(...items) {
    this.logOptions(items, { pre: false });
  }

  logCode(...items) {
    this.logOptions(items, { pre: true });
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
