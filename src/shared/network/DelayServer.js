const delayServer = Server =>
  class DelayServer extends Server {
    constructor(maxConnections) {
      super(maxConnections);
      this.delays = {};
    }

    setDelay(player, delay) {
      this.setDelayMS(player, delay * 1000);
    }

    setDelayMS(player, delay) {
      this.delays[player] = delay;
      console.log(this.delays);
    }

    setPlayerDelay(playerID, delay) {
      this.delays[playerID] = delay * 500;
    }

    sendDelay(delay, message, socketIndex) {
      if (delay > 0) {
        setTimeout(() => {
          super.send(message, socketIndex);
        }, delay);
      } else {
        super.send(message, socketIndex);
      }
    }

    sendIndex(message, socketIndex) {
      const delay = this.delays[socketIndex];
      this.sendDelay(delay, message, socketIndex);
    }

    send(message, socketIndex = -1) {
      if (socketIndex === -1) {
        for (const index in this.connections) {
          this.sendIndex(message, index);
        }
      } else {
        this.sendIndex(message, socketIndex);
      }
    }

    onMessage(message, socketIndex) {
      const delay = this.delays[socketIndex];
      if (delay > 0) {
        setTimeout(() => {
          super.onMessage(message, socketIndex);
        }, delay);
      } else {
        super.onMessage(message, socketIndex);
      }
    }

    onOpen(socketIndex) {
      super.onOpen(socketIndex);
      this.setDelay(socketIndex, 0);
    }

    onClose(socketIndex) {
      super.onClose(socketIndex);
      delete this.delays[socketIndex];
    }
  };

export default delayServer;
