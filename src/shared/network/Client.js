class Client {
  constructor(addr) {
    this.socket = new WebSocket(addr);
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.onclose = this.onClose.bind(this);
    this.socket.onopen = this.onOpen.bind(this);
    this.socket.onerror = console.log;
  }

  onClose() { }

  /**
   * This methos is triggered when the socket receives a message from the 
   * server.
   * @param message The received message
   */
  onMessage(message) { }

  /**
   * This method is triggered when the socket is opened.
   */
  onOpen() { }

  /**
   * Sends the specified message across the websocket.
   * @param message The message to send
   */
  send(message) {
    this.socket.send(JSON.stringify(message));
  }
}

export default Client;