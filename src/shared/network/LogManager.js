import GM from '../event/GameManager';
import fs from 'fs';
import { isServer } from '../util/util';

const makeDir = path => {
  if(!fs.existsSync(path)){
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
      makeDir('game-logs/game-' + this.gameNum.toString());
    })
    GM.registerHandler('PLAYER_DISCONNECT', data => {
      this.closeStream(data.socketIndex);
    })
    makeDir('game-logs/game-' + this.gameNum.toString());
  }

  logData(data, id = -1) {
    if (isServer()) {
      if (!(id in this.streamMap)) {
        this.streamMap.id = fs.createWriteStream('game-logs/game-' + this.gameNum.toString() + '/player-' + id.toString() + '.txt', { flags: 'a' })
          .on('finish', function () {
            console.log("Write Finish.");
          })
          .on('error', function (err) {
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
      this.streamMap.id.write(stringData + '\n', (err) => {
        if (err) {
          throw err;
        }
      });
    }
  }

  closeAllStreams() {
    for (const curKey in this.streamMap) {
      this.streamMap[curKey].end();
    }
    this.streamMap = {};
  }

  closeStream(id) {
    if (id in this.streamMap) {
      this.streamMap[id].end();
      delete this.streamMap[id];
    }
  }
}

const LM = new LogManager();
export default LM;