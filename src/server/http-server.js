import express from 'express';
import http from 'http';
import path from 'path';

const HTML_FILE = path.join(__dirname, '..', 'client', 'index.html');

const serveHTTP = () => {
  const app = express();
  app.use('/dist', express.static(path.join(__dirname, '..', 'client')));
  app.get('/', (req, res) => {
    res.sendFile(HTML_FILE);
  });
  return http.createServer(app);
};

export default serveHTTP;
