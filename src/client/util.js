import uuid from "uuid/v1";
import NM from "../shared/network/NetworkManager";
import GM from "../shared/event/GameManager";

export const scaleVector = (vec, scale = 1) => {
  vec[0] *= scale;
  vec[1] *= scale;
};

export const addVector = (vec, [x, y]) => {
  vec[0] += x;
  vec[1] += y;
};

export const parseLocation = url => {
  const obj = {};
  const start = url.indexOf("?");
  if (start >= 0) {
    const rest = url.substring(start + 1);
    const sections = rest.split("&");
    for (const section of sections) {
      const equals = section.indexOf("=");
      if (equals >= 0) {
        const key = decodeURIComponent(section.substring(0, equals));
        const value = decodeURIComponent(section.substring(equals + 1));
        obj[key] = value;
      } else {
        throw new Error("Invalid query argument");
      }
    }
  }
  return obj;
};
