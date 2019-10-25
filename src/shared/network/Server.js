import { server as WebsocketServer } from 'websocket';
import express from 'express';
import http from 'http';
import path from 'path';
import GM from '../event/GameManager';
import NM from '../network/NetworkManager';
import WM from '../entity/WorldManager';

const HTML_FILE = path.join(__dirname, '..', 'client', 'index.html');

const serveHTTP = () => {
  const app = express();
  app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
  app.use('/dist', express.static(path.join(__dirname, '..', 'client')));
  app.get('/', (req, res) => {
    res.sendFile(HTML_FILE);
  });
  return http.createServer(app);
};

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
    NM.initialize(this);

    GM.registerHandler('PING_CLIENT', data => {
      const event = {
        type: 'PING_SERVER',
        data
      };
      NM.send(event, data.playerID);
    });

    GM.registerHandler('SYNC_OBJECT', event => {
      WM.receiveSyncObject(event.object);
    });

    GM.registerHandler('CREATE_RAY', data => {
      this.send({
        type: 'CREATE_RAY',
        data
      });
    })

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
    message.time = Date.now();
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

  onMessage(message, socketIndex) {
    message.data.socketIndex = socketIndex;
    GM.emitEvent(message);
  }

  onOpen(socketIndex) {
    WM.sync(this, socketIndex);
  }

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
