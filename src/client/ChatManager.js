import NM from "../shared/network/NetworkManager";
import GM from "../shared/event/GameManager";

class ChatManager {
  constructor() {
    this.messageContainer = document.getElementById('chat-container');
    this.chatForm = document.getElementById('chat-form');
    this.chatInput = document.getElementById('chat-input');
    this.playerID = -1;
    this.commands = {};
    this.name = 'Anonymous';
  }

  registerCommand(command, callback) {
    this.commands[command] = callback;
  }

  /*
  
    & --> &amp;
    < --> &lt;
    > --> &gt;
    " --> &quot;
    ' --> &#x27;     &apos; is not recommended
    / --> &#x2F; 

  */

  escapeMessage(message) {
    return message
      .replace('&', '&amp')
      .replace('<', '&lt')
      .replace('>', '&gt')
      .replace('"', '&quot')
      .replace('\'', '&#x27')
      .replace('/', '<span>&#x2F</span>');
  }

  initialize(playerID) {
    GM.registerHandler('CHAT_OUTPUT', event => {
      this.addMessage(event.message);
    });

    GM.registerHandler('KEY_DOWN', event => {
      if (event.key === 'Enter') {
        this.chatInput.focus();
      }
    });

    this.registerCommand('roll', args => {
      if (args.length === 1) {
        try {
          const die = JSON.parse(args[0]);
          if (typeof die === 'number') {
            const roll = Math.floor(Math.random() * die) + 1;
            const line = this.renderContent({
              color: 'white',
              text: `<b>[d${die}]:</b> ${roll}`
            });
            this.addLine(line);
          } else {
            const error = `\'roll\' expects number, received ${typeof die}.`;
            this.addError(error);
          }
        } catch (_) {
          const error = `Failed to parse argument: ${args[0]}.`;
          this.addError(error);
        }
      } else {
        const error = `\'roll\' expects 1 argument, received ${args.length}.`;
        this.addError(error);
      }
    });

    this.registerCommand('setname', args => {
      if (args.length === 1) {
        const name = args[0];
        this.name = this.escapeMessage(name);
        const line = this.renderContent({
          color: 'rgb(0, 255, 0)',
          text: `Your name has been set to \'${name}\'.`
        });
        this.addLine(line);
      } else {
        const error = `\'setname\' expects 1 argument, received ${args.length}.`;
        this.addError(error);
      }
    });

    this.playerID = playerID;
    this.chatForm.onsubmit = e => {
      e.preventDefault();

      // Gather input
      let { value } = this.chatInput;

      if (value.length === 0) {
        return;
      }

      this.chatInput.value = '';

      if (value.startsWith('/')) {
        value = value.slice(1);
        // We have a command
        const components = value.split(/\s+/);
        const command = components[0];
        const callback = this.commands[command];
        console.log(callback);
        if (typeof callback === 'function') {
          callback(components.slice(1));
        } else {
          const error = `Unknown command: ${command}.`;
          this.addError(error);
        }
      } else {
        const message = {
          author: this.name,
          content: value,
          time: Date.now()
        };
        NM.send({
          type: 'CHAT_INPUT',
          data: {
            message
          }
        });
      }
    };
  }

  renderMessage(message) {
    const { author, time, content } = message;
    const text = `<b>${author}:</b> ${this.escapeMessage(content)}`;
    return this.renderContent({
      color: 'white',
      text
    });
  }

  renderContent(line) {
    const { color = 'white', text } = line;
    const element = document.createElement('div');
    element.style = `color: ${color}`;
    element.innerHTML = text;
    return element;
  }

  addLine(line) {
    this.messageContainer.appendChild(line);
    // this.messageContainer.scrollIntoView(false);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  addError(error) {
    const component = this.renderContent({
      color: 'red',
      text: error
    });
    this.addLine(component);
  }

  addMessage(message) {
    const component = this.renderMessage(message);
    this.addLine(component);
  }
}

const CM = new ChatManager();
export default CM;