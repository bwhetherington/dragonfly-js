const delayServer = (Server, delay = 0) => class DelayServer extends Server {
  constructor(maxConnections) {
    super(maxConnections);
    this.delayMS = delay * 1000;
  }

  send(message, socketIndex = -1) {
    if (this.delayMS > 0) {
      setTimeout(() => {
        super.send(message, socketIndex);
      }, this.delayMS);
    } else {
      super.send(message, socketIndex);
    }
  }

  onMessage(message, socketIndex) {
    if (this.delayMS > 0) {
      setTimeout(() => {
        super.onMessage(message, socketIndex);
      }, this.delayMS);
    } else {
      super.onMessage(message, socketIndex);
    }
  }
};

export default delayServer;