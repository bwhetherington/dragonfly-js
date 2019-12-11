import { server as WebsocketServer } from 'websocket';
import express from 'express';
import http from 'http';
import path from 'path';
import GM from '../event/GameManager';
import NM from '../network/NetworkManager';
import WM from '../entity/WorldManager';
import uuid from 'uuid/v1';
import LM from './LogManager';

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
    this.freedIDs = [];
  }

  get numConnections() {
    return Object.keys(this.connections).length;
  }

  recordEventType(type) {
    GM.recordType(type);
  }

  initialize() {
    // Create http server
    this.httpServer = serveHTTP();
    NM.initialize(this);
    LM.initialize();

    this.recordEventType('JOIN_GAME');
    this.recordEventType('STEP');
    this.recordEventType('KEY_DOWN');
    this.recordEventType('KEY_UP');
    this.recordEventType('TIME_WARPED_MOUSE_DOWN');
    this.recordEventType('MOUSE_UP');
    this.recordEventType('ROTATE_CANNON');

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
    this.wsServer = new WebsocketServer({ httpServer: this.httpServer });

    // Handle incoming requests
    this.wsServer.on('request', request => {
      if (this.numConnections < this.maxConnections) {
        this.accept(request);
      }
    });
  }

  start() {
    const port = process.env.PORT || 3000;
    this.httpServer.listen(port, () => {
      const time = new Date().toISOString();
      console.log(`[${time}] Listening on port ${port}...`);
    });
  }

  stop() {
    this.httpServer.close();
  }

  get numConnections() {
    return Object.keys(this.connections).length;
  }

  getPing(playerID) {
    return new Promise(resolve => {
      const id = uuid();
      const start = now();
      this.send({
        type: 'CHECK_PING',
        data: { id }
      }, playerID);
      this.pingChecks[id] = {
        start,
        id,
        playerID,
        resolve
      };
    });
  }

  checkPings() {
    for (const playerID in this.connections) {
      this.getPing(playerID).then(ping => {
        this.send({
          type: 'DISPLAY_PING',
          data: {
            id: playerID,
            ping
          }
        });
      });
    }
  }

  onLastConnection() { }

  send(message, socketIndex = -1) {
    message.time = Date.now();
    // Serialize the message
    const data = JSON.stringify(message);
    // console.log(data.length);

    if (socketIndex === -1) {
      // If the index is -1, send to all connections
      for (const index in this.connections) {
        const connection = this.connections[index];
        if (connection) {
          connection.sendUTF(data);
        }
      }
    } else {
      // Otherwise send it to only the specified client
      const connection = this.connections[socketIndex];
      if (connection) {
        connection.sendUTF(data);
      }
    }
  }

  onMessage(message, socketIndex) {
    message.data.socketIndex = socketIndex;
    if (message.type === 'CHECK_PING') {
      const { id } = message.data;
      const check = this.pingChecks[id];
      if (check) {
        const { start, resolve } = check;
        const end = now();
        resolve(end - start);
        delete this.pingChecks[id];
      }
    } else {
      GM.emitEvent(message);
    }
  }

  onOpen(socketIndex) {
    WM.sync(this, socketIndex, true);
  }

  onClose(socketIndex) {
    this.freedIDs.push(socketIndex);
    const message = {
      type: 'PLAYER_DISCONNECT',
      data: { socketIndex }
    };
    GM.emitEvent(message);
  }

  assignPlayerID() {
    if (this.freedIDs.length > 0) {
      return this.freedIDs.shift();
    } else {
      const index = this.socketIndex;
      this.socketIndex += 1;
      return index;
    }
  }

  accept(request) {
    const connection = request.accept(null, request.origin);
    const connectionIndex = this.assignPlayerID();

    this.connections[connectionIndex] = connection;

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
