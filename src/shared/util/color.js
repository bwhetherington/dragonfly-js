export const color = (red, green, blue) => ({
  red,
  green,
  blue,
});

export const getFill = (c) => {
  const { red, green, blue, alpha = 1 } = c;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const getStroke = (c) => {
  let { red, green, blue, alpha = 1 } = c;
  red -= 50;
  green -= 50;
  blue -= 50;
  return `rgb(${Math.max(0, red)}, ${Math.max(0, green)}, ${Math.max(
    0,
    blue
  )}, ${alpha})`;
};

export const getBrighter = (original, amount) => {
  const { red, green, blue, alpha = 1 } = original;
  return color(
    Math.min(red * amount, 255),
    Math.min(green * amount, 255),
    Math.min(blue * amount, 255),
    alpha
  );
};

export const flashColor = color(255, 255, 255);
