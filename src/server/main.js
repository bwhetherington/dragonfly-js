import serveHTTP from './http-server';
import Server from './websocket-server';

const main = async () => {
  const httpServer = serveHTTP();
  new Server(httpServer);
  httpServer.listen(process.env.PORT || 3000);
};

main().catch(console.err);
