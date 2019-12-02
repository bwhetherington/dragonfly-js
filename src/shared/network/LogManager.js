import GM from '../event/GameManager';
import fs from 'fs';
import { isServer } from '../util/util';

const makeDir = path => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

class LogManager {
  constructor() {
    this.streamMap = {};
    this.gameNum = 0;
  }

  initialize() {
    GM.registerHandler('RESET_GAME', data => {
      this.closeAllStreams();
      this.gameNum++;
      makeDir(`game-logs/game:${this.gameNum}`);
    })
    GM.registerHandler('PLAYER_DISCONNECT', data => {
      this.closeStream(data.socketIndex);
    })
    makeDir('game-logs/');
    makeDir(`game-logs/game:${this.gameNum}`);
  }

  logData(data, id = -1) {
    if (isServer()) {
      if (!this.streamMap.hasOwnProperty(id)) {
        const file = `game-logs/game:${this.gameNum}/player:${id}.log`;
        this.streamMap[id] = fs.createWriteStream(file, { flags: 'a' })
          .on('finish', () => {
            console.log("Write Finish.");
          })
          .on('error', err => {
            console.log(err.stack);
          });
      }
      const time = GM.timeElapsed;
      let finalData = {
        data: data,
        time: time,
        rollback: GM.rollback
      }
      const stringData = JSON.stringify(finalData);
      this.streamMap[id].write(stringData + '\n', err => {
        if (err) {
          throw err;
        }
      });
    }
  }

  closeAllStreams() {
    for (const key in this.streamMap) {
      this.closeStream(key);
    }
  }

  closeStream(id) {
    if (this.streamMap.hasOwnProperty(id)) {
      this.streamMap[id].end();
      delete this.streamMap[id];
    }
  }
}

const LM = new LogManager();
export default LM;