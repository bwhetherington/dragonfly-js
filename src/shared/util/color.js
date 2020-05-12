export const color = (red, green, blue) => ({
  red,
  green,
  blue,
});

export const getFill = (c) => {
  const { red, green, blue, alpha = 1 } = c;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const BORDER_DARKNESS = 40;

export const getStroke = (c) => {
  let { red, green, blue, alpha = 1 } = c;
  red -= BORDER_DARKNESS;
  green -= BORDER_DARKNESS;
  blue -= BORDER_DARKNESS;
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
