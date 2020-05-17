import NM from "../shared/network/NetworkManager";
import GM from "../shared/event/GameManager";
import SizedQueue from "../shared/util/SizedQueue";
import { iterator } from "lazy-iters";
import WM from "../shared/entity/WorldManager";
import { formatJSON, flatten } from "../shared/util/util";
import Enemy from "../shared/entity/Enemy";
import { makeAnimation } from "../shared/entity/Animation";
import Shadow from "../shared/entity/Shadow";

const rgba = (r, g, b, a) => "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";

const removeChildren = (element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

class ElementQueue {
  constructor(parent, size = Infinity) {
    this.parent = document.getElementById(parent);
    this.queue = new SizedQueue(size);
  }

  get style() {
    return this.parent.style;
  }

  appendChild(element) {
    const removed = this.queue.enqueue(element);
    if (removed) {
      this.parent.removeChild(removed);
    }
    this.parent.appendChild(element);
  }

  set scrollTop(val) {
    return (this.parent.scrollTop = val);
  }

  get scrollTop() {
    return this.parent.scrollTop;
  }

  set scrollHeight(val) {
    return (this.parent.scrollHeight = val);
  }

  get scrollHeight() {
    return this.parent.scrollHeight;
  }

  clear() {
    removeChildren(this.parent);
    this.queue.clear();
  }
}

const FLASH_DURATION = 3;

const COLORS = {
  white: "white",
  red: "rgb(255, 75, 75)",
  green: "rgb(125, 195, 55)",
  blue: "rgb(55, 125, 255)",
  yellow: "rgb(255, 255, 55)",
  orange: "rgb(255, 175, 55)",
};

class ChatManager {
  constructor() {
    this.messageContainer = new ElementQueue("chat-container", 250);
    this.chatboxContainer = document.getElementById("chatbox-container");
    this.chatForm = document.getElementById("chat-form");
    this.chatInput = document.getElementById("chat-input");

    this.commands = {};
    this.client = null;
    this.name = "Anonymous";
    this.filter = false;

    this.isFlashed = false;
    this.isFocused = false;

    this.chatInput.onfocus = () => {
      this.isFocused = true;
      this.unhide();
    };
    this.chatInput.onblur = () => {
      this.isFocused = false;
      this.hide();
    };

    this.timer = 0;

    GM.registerHandler("STEP", (event) => {
      this.timer = Math.max(0, this.timer - event.dt);
      if (this.timer === 0) {
        this.unflash();
      }
    });
  }

  hide() {
    if (!this.isFocused) {
      this.chatboxContainer.style.visibility = "hidden";
    }
  }

  unhide() {
    this.chatboxContainer.style.visibility = "visible";
  }

  flash() {
    this.timer = FLASH_DURATION;
    if (!this.isFlashed) {
      this.isFlashed = true;
      // this.chatInput.style.backgroundColor = rgba(60, 60, 60, 0.67);
      // this.chatInput.style.color = "black";
      this.unhide();
    }
  }

  unflash() {
    this.isFlashed = false;
    // this.chatInput.style.backgroundColor = rgba(0, 0, 0, 0.67);
    // this.chatInput.style.color = "white";
    this.hide();
  }

  registerCommand(command, callback) {
    this.commands[command] = callback;
  }

  displayComponents(components) {
    this.addLine(this.renderComponents(components));
  }

  renderComponent(component) {
    if (component === null) {
      return document.createElement("br");
    } else if (typeof component === "string") {
      return document.createTextNode(component);
    } else {
      const {
        value = [],
        style = {},
        color = null,
        onClick = null,
        onHover = null,
        transparent = false,
      } = component;
      const element = document.createElement("span");

      if (value instanceof Array) {
        this.renderComponentIterator(value).forEach((component) =>
          element.append(component)
        );
      } else {
        element.innerText = value;
      }
      if (color !== null) {
        // Look up color
        const textColor = COLORS[color];
        if (textColor) {
          element.style.color = textColor;
        }
      }
      for (const key in style) {
        element.style[key] = style[key];
      }
      if (onClick) {
        element.onClick = onClick;
      }
      // if (onHover) {
      element.onhover = console.log;
      // }
      return element;
    }
  }

  renderComponentIterator(components) {
    return iterator(components).map((component) =>
      this.renderComponent(component)
    );
  }

  renderComponents(components) {
    const line = document.createElement("div");
    line.className = "chat-line";
    iterator(components)
      .map((component) => this.renderComponent(component))
      .forEach((element) => {
        line.appendChild(element);
      });
    return line;
  }

  parseComponents(input) {
    const components = [];
    let text = "";
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch === "\\") {
      }
    }
    return components;
  }

  displayMessage(message, color = "white") {
    const line = this.renderContent({
      text: message,
      color,
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
      .replace("&", "&amp")
      .replace("<", "&lt")
      .replace(">", "&gt")
      .replace('"', "&quot")
      .replace("'", "&#x27")
      .replace("/", "<span>&#x2F</span>");
  }

  initialize(client) {
    this.client = client;

    GM.registerHandler("CHAT_COMPONENT_OUTPUT", (event) => {
      const { components } = event;
      this.displayComponents(components);
      if (!this.isFocused) {
        this.flash();
      }
    });

    GM.registerHandler("KEY_DOWN", (event) => {
      if (event.key === "Enter") {
        this.chatInput.focus();
      }
    });

    this.chatForm.onsubmit = (e) => {
      e.preventDefault();

      // Gather input
      let { value } = this.chatInput;

      if (value.length === 0) {
        return;
      }

      this.chatInput.value = "";

      if (value.startsWith("/")) {
        value = value.slice(1);
        // We have a command
        const components = value.split(/\s+/);
        const command = components[0];
        // const callback = this.commands[command];
        const args = components.slice(1);
        NM.send({
          type: "CHAT_COMMAND",
          data: {
            command,
            args,
          },
        });
        // if (typeof callback === "function") {
        //   callback(args);
        // } else {
        //   const error = `Unknown command: ${command}.`;
        //   this.addError(error);
        // }
      } else {
        const message = {
          author: this.name,
          content: value,
          id: client.playerID,
          time: Date.now(),
        };
        NM.send({
          type: "CHAT_INPUT",
          data: {
            message,
          },
        });
      }
    };
  }

  clear() {
    this.messageContainer.clear();
  }

  renderTimestamp(time) {
    const date = new Date(time);
    const text = date.toLocaleTimeString("en-US");
    const element = document.createElement("span");
    element.append("[", text, "]");
    return element;
  }

  getPlayerColor(id) {
    const hero = this.client.heroes[id];
    const color = hero ? hero.color : null;
    return this.getColor(color);
  }

  getHeroColor(hero) {
    if (hero) {
      return this.getColor(hero.color);
    } else {
      return "white";
    }
  }

  getColor(color, increase = 75) {
    if (color) {
      let { red, green, blue, alpha = 1 } = color;
      red = Math.min(255, red + increase);
      green = Math.min(255, green + increase);
      blue = Math.min(255, blue + increase);
      return "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
    } else {
      return "white";
    }
  }

  renderContent(line) {
    const { color = "white", text } = line;
    const element = document.createElement("div");
    element.className = "chat-line";
    element.style = {
      color,
    };
    element.innerHTML = text;
    return element;
  }

  addLine(line) {
    this.messageContainer.appendChild(line);
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
  }

  addError(error) {
    const component = this.renderContent({
      color: "red",
      text: error,
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
