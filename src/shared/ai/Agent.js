import { Vector } from "twojs-ts";
import GM from "../event/GameManager";

class Agent {

  constructor(playerID) {
    this.playerID = playerID;
    this.inputState = {
      up: false,
      down: false,
      left: false,
      right: false,
      mousePosition: new Vector(),
      mouse: false
    }
  }

  setMousePosition(vector) {
    this.inputState.mousePosition.set(vector);
    const event = {
      type: 'MOUSE_MOVE',
      data: {
        position: this.inputState.mousePosition.serialize()
      }
    };
    GM.emitEvent(event);
  }

  setKey(key, state) {
    const oldState = this.input[key];
    if (state !== oldState) {
      this.input[key] = state;

      // Output event
      let type;
      if (state) {
        type = 'KEY_DOWN';
      } else {
        type = 'KEY_UP';
      }

      const event = {
        type,
        data: {
          key,
          alt: false,
          shift: false,
          ctrl: false
        }
      };

      GM.emitEvent(event);
    }
  }



  process() {
    // process the current game state and make a decision as to outputs
    return [];
  }

}

export default Agent;