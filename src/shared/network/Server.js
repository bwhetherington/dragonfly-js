import { server as WebsocketServer } from 'websocket';
import serveHTTP from './http-server';

class Server {
  constructor(maxConnections) {
    this.maxConnections = maxConnections;
    this.connections = {};
    this.socketIndex = 0;
    this.wsServer = null;
  }

  initialize() {
    // Create http server
    const httpServer = serveHTTP();

    // Attach websocket server to http server
    this.wsServer = new WebsocketServer({ httpServer });

    // Handle incoming requests
    this.wsServer.on('request', request => {
      if (this.numConnections < this.maxConnections) {
        this.accept(request);
      }
    });

    httpServer.listen(process.env.PORT || 3000);
  }

  get numConnections() {
    return Object.keys(this.connections).length;
  }

  onLastConnection() { }

  send(message, socketIndex = -1) {
    // Serialize the message
    const data = JSON.stringify(message);

    if (socketIndex === -1) {
      // If the index is -1, send to all connections
      for (const index in this.connections) {
        const connection = this.connections[index];
        connection.sendUTF(data);
      }
    } else {
      // Otherwise send it to only the specified client
      const connection = this.connections[socketIndex];
      connection.sendUTF(data);
    }
  }

  onMessage(message, socketIndex) { }

  onOpen(socketIndex) { }

  onClose(socketIndex) { }

  accept(request) {
    const connection = request.accept(null, request.origin);
    const connectionIndex = this.socketIndex;

    this.connections[connectionIndex] = connection;
    this.socketIndex += 1;

    this.onOpen(connectionIndex);

    // Handle receive message from client
    connection.on('message', message => {
      if (message.type === 'utf8') {
        const data = JSON.parse(message.utf8Data);
        this.onMessage(data, connectionIndex);
      }
    });

    // Remove connection
    connection.on('close', () => {
      this.onClose(connectionIndex);
      delete this.connections[connectionIndex];
    });
  }
}

export default Server;
