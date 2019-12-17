import GM from "../event/GameManager";
import { uuid } from "../util/util";

class Animation {

}

const clamp = (x, low, high) => Math.max(low, Math.min(x, high));

const smoothStep = x => {
  x = clamp(x, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export const makeAnimation = (from, to, duration, smoother = smoothStep) => {
  const id = uuid();
  let time = 0;
  const state = {};
  const keys = Object.keys(from);

  GM.registerHandler('STEP', (event, remove) => {
    const { dt } = event;
    time += dt;

    const progress = smoother(time / duration);

    // Interpolate between states
    for (const key of keys) {
      const a = from[key];
      const b = to[key];
      const interpolated = (1 - progress) * a + progress * b;
      state[key] = interpolated;
    }

    const update = {
      type: 'ANIMATION_UPDATE',
      data: {
        id,
        state
      }
    };

    GM.emitEvent(update);

    if (time >= duration) {
      remove();
    }
  });

  return id;
}