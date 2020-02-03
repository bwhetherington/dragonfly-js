const lineReader = require("line-reader");

const parseLogs = (fileName, cb) => {
  lineReader.eachLine(fileName, line => {
    if (line.length > 0) {
      cb(null, JSON.parse(line));
    }
  });
};

const main = async () => {
  const fileName = "game-logs/game:0/player:-1.log";
  const objects = [];
  parseLogs(fileName, (err, log) => {
    if (log.data.type === "CREATE_OBJECT") {
      console.log(JSON.stringify(log.data.data));
    }
  });
};

main().catch(console.log);
