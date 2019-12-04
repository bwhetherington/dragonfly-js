import NM from "../shared/network/NetworkManager";
import GM from "../shared/event/GameManager";
import SizedQueue from "../shared/util/SizedQueue";
import { iterator } from 'lazy-iters';

const rgba = (r, g, b, a) => 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';

const removeChildren = element => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

class ElementQueue {
  constructor(parent, size = Infinity) {
    this.parent = document.getElementById(parent);
    this.queue = new SizedQueue(size);
  }

  appendChild(element) {
    const removed = this.queue.enqueue(element);
    if (removed) {
      this.parent.removeChild(removed);
    }
    this.parent.appendChild(element);
  }

  set scrollTop(val) {
    return this.parent.scrollTop = val;
  }

  get scrollTop() {
    return this.parent.scrollTop;
  }

  set scrollHeight(val) {
    return this.parent.scrollHeight = val;
  }

  get scrollHeight() {
    return this.parent.scrollHeight;
  }

  clear() {
    removeChildren(this.parent);
    this.queue.clear();
  }
}

class ChatManager {
  constructor() {
    this.messageContainer = new ElementQueue('chat-container', 250);
    this.chatForm = document.getElementById('chat-form');
    this.chatInput = document.getElementById('chat-input');

    this.playerID = -1;
    this.commands = {};
    this.name = 'Anonymous';
    this.filter = false;

    this.isFlashed = false;
    this.isFocused = false;

    this.chatInput.onfocus = () => {
      this.isFocused = true;
    };
    this.chatInput.onblur = () => {
      this.isFocused = false;
    };
  }

  flash() {
    if (!this.isFlashed) {
      this.isFlashed = true;
      this.chatInput.style.backgroundColor = rgba(60, 60, 60, 0.67);
      this.chatInput.style.color = 'black';
      GM.runDelay(0.25, () => {
        if (this.isFlashed) {
          this.unflash();
        }
      })
    }
  }

  unflash() {
    this.isFlashed = false;
    this.chatInput.style.backgroundColor = rgba(0, 0, 0, 0.67);
    this.chatInput.style.color = 'white';
  }

  registerCommand(command, callback) {
    this.commands[command] = callback;
  }

  displayComponents(components) {
    this.addLine(this.renderComponents(components));
  }

  renderComponent(component) {
    if (typeof component === 'string') {
      return document.createTextNode(component);
    } else {
      const { text = '', style = {}, onClick = null } = component;
      const element = document.createElement('span');
      element.innerText = text;
      for (const key in style) {
        element.style[key] = style[key];
      }
      if (onClick) {
        element.onClick = onClick;
      }
      return element;
    }
  }

  renderComponents(components) {
    const line = document.createElement('div');
    line.className = 'chat-line';
    iterator(components)
      .map(component => this.renderComponent(component))
      .forEach(element => {
        line.appendChild(element);
      });
    return line;
  }

  parseComponents(text) {

  }

  displayMessage(message, color = 'white') {
    const line = this.renderContent({
      text: message,
      color
    });
    this.addLine(line);
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

    this.registerCommand('comp', () => {
      this.flash();
      this.displayComponents([
        {
          text: '[Button]',
          style: {
            fontWeight: 'bold'
          }
        },
        {
          text: ' text'
        }
      ]);
    });

    this.registerCommand('rollback', () => {
      this.displayMessage('Attempted rollback.');
      NM.send({
        type: 'ROLLBACK',
        data: {}
      });
    })

    this.registerCommand('clear', () => {
      this.messageContainer.clear();
      this.displayMessage('Chat box has been cleared.');
    });

    this.registerCommand('stats', () => {
      NM.send({
        type: 'REQUEST_STATS',
        data: {}
      });
    });

    GM.registerHandler('SEND_STATS', event => {
      const { entityCount, listenerCount } = event;
      const line = this.renderMessage({
        author: 'Server',
        time: Date.now(),
        id: -1,
        content: `Entities: ${entityCount}, Handlers: ${listenerCount}`
      });
      this.addLine(line);
    });

    this.registerCommand('noclip', () => {
      const { hero } = this;
      if (hero) {
        hero.isCollidable = !hero.isCollidable;
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
        if (typeof callback === 'function') {
          callback(components.slice(1));
        } else {
          const error = `Unknown command: ${command}.`;
          this.addError(error);
        }
      } else {
        const message = {
          author: this.name,
          id: this.playerID,
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

  renderTimestamp(time) {
    const date = new Date(time);
    const text = date.toLocaleTimeString('en-US');
    const element = document.createElement('span');
    element.append('[', text, ']');
    return element;
  }

  renderMessage(message) {
    const { author, time, id, content, pre } = message;
    const components = [
      {
        text: '[' + id + ']',
        style: {
          opacity: '50%'
        }
      },
      ' ',
      {
        text: author + ':',
        style: {
          fontWeight: 'bold'
        }
      },
      ' ' + content
    ];
    return this.renderComponents(components);

    // const element = document.createElement('div');

    // if (pre) {
    //   element.style.whiteSpace = 'pre';
    // }

    // const idTag = document.createElement('span');
    // idTag.append('[', id, ']');
    // idTag.style.opacity = '50%';

    // const authorLabel = document.createElement('b');
    // authorLabel.append(author, ': ');

    // const messageComponent = document.createElement('span');
    // messageComponent.innerHTML = content;

    // element.append(idTag, ' ', authorLabel, messageComponent);

    // return element;

    // const text = `<b>${author}:</b> ${this.escapeMessage(content)}`;
    // return this.renderContent({
    //   color: 'white',
    //   text
    // });
  }

  renderContent(line) {
    const { color = 'white', text } = line;
    const element = document.createElement('div');
    element.className = 'chat-line';
    element.style = {
      color
    }
    element.innerHTML = text;
    return element;
  }

  addLine(line) {
    this.messageContainer.appendChild(line);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;

    // Flash
    if (!this.isFocused) {
      this.flash();
    }
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