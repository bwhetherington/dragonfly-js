import { server as WebsocketServer } from 'websocket';
import express from 'express';
import http from 'http';
import path from 'path';
import GM from '../event/GameManager';
import NM from '../network/NetworkManager';
import WM from '../entity/WorldManager';
import uuid from 'uuid/v1';

const toSeconds = (seconds, nanoseconds) => seconds + nanoseconds * 0.000000001;

const now = () => {
  const [seconds, nanoseconds] = process.hrtime();
  const time = toSeconds(seconds, nanoseconds);
  return time;
}

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
    this.pingChecks = {};
    this.playerPings = {};
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

    const port = process.env.PORT || 3000;
    const time = new Date().toISOString();
    httpServer.listen(port, () => {
      console.log(`[${time}] Listening on port ${port}...`);
    });
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

  getPlayerLatencies() {
    for (const playerID in this.connections) {
      const start = now();
      const id = uuid();
      const ping = { type: 'CHECK_PING', data: { id } };
      this.send(ping, playerID);
      this.pingChecks[id] = { start };
    }
  }

  sendPlayerLatencies() {
    const message = {
      type: 'DISPLAY_PING',
      data: {
        latencies: this.playerPings
      }
    };
    for (const playerID in this.connections) {
      let ping = this.playerPings[playerID];
      if (ping === undefined) {
        ping = Number.NaN;
      }
      message.data.latencies[playerID] = ping;
    }
    this.send(message);
  }

  onMessage(message, socketIndex) {
    message.data.socketIndex = socketIndex;
    if (message.type === 'CHECK_PING') {
      const { id } = message.data;
      const check = this.pingChecks[id];
      if (check) {
        const { start } = check;
        const end = now();
        this.playerPings[socketIndex] = end - start;
        delete this.pingChecks[id];
      }
    } else {
      GM.emitEvent(message);
    }
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
