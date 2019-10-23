export const isServer = () => !isClient();

export const isClient = () => {
  try {
    window;
    return true;
  } catch (_) {
    return false;
  }
};