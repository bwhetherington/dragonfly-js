import NM from "../shared/network/NetworkManager";
import GM from "../shared/event/GameManager";

class ChatManager {
  constructor() {
    this.commands = {};
  }

  initialize(server) {
    this.server = server;

    GM.registerHandler("CHAT_INPUT", (data) => {
      const { author, content } = data.message;
      const comps = [
        {
          value: `<${author}>`,
          style: {
            fontWeight: "bold",
          },
          color: "red",
        },
        " " + content,
      ];
      this.sendMessage(comps);
    });

    GM.registerHandler("CHAT_COMMAND", (event) => {
      const { command, args, socketIndex } = event;
      this.runCommand(socketIndex, command, args);
    });

    this.registerCommand(
      "help",
      (id) => {
        const output = [{ value: "Info: Commands", color: "yellow" }];
        for (const command in this.commands) {
          output.push(null);
          const entry = this.commands[command];
          output.push({ value: `${command}:` });
          output.push(` ${entry.help}`);
        }
        this.sendMessage(output, id);
      },
      "Lists all of the usable commands."
    );
  }

  registerCommand(command, callback, help = null, aliases = []) {
    const entry = {
      callback,
      help,
    };
    this.commands[command] = entry;
    for (const alias of aliases) {
      this.commands[alias] = entry;
    }
  }

  sendMessage(components, id = -1) {
    // Wrap components in an array if not already in one
    if (!(components instanceof Array)) {
      components = [components];
    }
    const packet = {
      type: "CHAT_COMPONENT_OUTPUT",
      data: { components },
    };
    NM.send(packet, id);
  }

  info(message, id = -1) {
    const comps = [
      {
        value: "Info:",
        style: {
          fontWeight: "bold",
        },
      },
      " " + message,
    ];
    this.sendMessage(comps, id);
  }

  warn(message, id = -1) {
    const comps = [
      {
        value: "Warn:",
        style: {
          fontWeight: "bold",
        },
        color: "yellow",
      },
      {
        value: " " + message,
        color: "yellow",
      },
    ];
    this.sendMessage(comps, id);
  }

  error(message, id = -1) {
    const comps = [
      {
        value: "Error:",
        style: {
          fontWeight: "bold",
        },
        color: "red",
      },
      {
        value: " " + message,
        color: "red",
      },
    ];
    this.sendMessage(comps, id);
  }

  runCommand(id, command, args) {
    const entry = this.commands[command];
    if (entry && typeof entry.callback === "function") {
      try {
        entry.callback(id, ...args);
      } catch (ex) {
        let message = ex;
        if (ex instanceof Error) {
          message = ex.message;
        }
        this.error(message, id);
      }
    } else {
      this.error(`The command \`${command}\` is not defined.`);
    }
  }
}

const CM = new ChatManager();
export default CM;
