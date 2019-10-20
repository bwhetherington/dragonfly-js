import Timer from './timer';
import GM from '../shared/event/GameManager';
import Server from '../shared/network/Server';

const REFRESH_RATE = 60;

class GameServer extends Server {
  onMessage(message) {
    console.log(message);
  }
}

const main = async () => {
  const server = new GameServer(2);
  server.initialize();

  // Create the game timer
  const timer = new Timer(1 / REFRESH_RATE, dt => {
    GM.step(dt);
  });

  timer.start();
};

main().catch(console.err);
