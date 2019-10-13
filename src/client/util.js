export const scaleVector = (vec, scale = 1) => {
  vec[0] *= scale;
  vec[1] *= scale;
};

export const addVector = (vec, [x, y]) => {
  vec[0] += x;
  vec[1] += y;
};