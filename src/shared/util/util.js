export const isServer = () => !isClient();

export const isClient = () => !process;