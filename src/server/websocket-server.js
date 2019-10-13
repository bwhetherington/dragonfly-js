import { server as WebsocketServer } from 'websocket';


class Server {
  constructor(httpServer) {
    this.connections = {};
    this.socketIndex = 0;
    this.history = [];

    this.wsServer = new WebsocketServer({ httpServer });
    this.wsServer.on('request', request => {
      this.accept(request);
    });
  }

  sendMessage(message) {
    for (const index in this.connections) {
      const connection = this.connections[index];
      connection.sendUTF(JSON.stringify(message));
    }
  }

  accept(request) {
    const connection = request.accept(null, request.origin);
    const connectionIndex = this.socketIndex;

    this.connections[connectionIndex] = connection;
    this.socketIndex += 1;

    // Handle receive message from client
    connection.on('message', message => {
      console.log('message', message);
      if (message.type === 'utf8') {
        const data = JSON.parse(message.utf8Data);
        console.log(`message data: ${data}`);

        const packet = {
          sender: connectionIndex,
          content: data
        };

        console.log('packet', packet);

        // Add it to history
        this.history.push(packet);

        // Send it back to all connections
        this.sendMessage(packet);
      }
    });

    // Remove connection
    connection.on('close', () => {
      console.log(`client ${connectionIndex} has disconnected`);
      delete this.connections[connectionIndex];
    });

    // Send them the full history when they connect
    for (const message of this.history) {
      connection.sendUTF(JSON.stringify(message));
    }
  }
}

export default Server;
