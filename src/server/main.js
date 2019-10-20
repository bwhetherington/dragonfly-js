import Timer from './timer';
import GM from '../shared/event/GameManager';
import Server from '../shared/network/Server';
import Entity from '../shared/entity/Entity';

const REFRESH_RATE = 60;

class GameServer extends Server {
  onMessage(message, socketIndex) {
    console.log(socketIndex, message);
    this.send(message);
    this.send({ name: 'Fred' });
  }
}

const main = async () => {
  const server = new GameServer(2);
  server.initialize();

  const entity = new Entity();
  entity.velocity.setXY(30, 15);

  // Create the game timer
  const timer = new Timer(1 / REFRESH_RATE * 20, dt => {
    GM.step(dt);
    entity.step(dt / 3);
    server.send({
      type: 'sync',
      object: entity.serialize()
    });
  });

  timer.start();
};

main().catch(console.err);
