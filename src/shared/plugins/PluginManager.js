class PluginManager {
  constructor() {
    this.isInitialized = false;
    this.toInit = [];
    this.plugins = [];
  }

  initialize() {
    for (const plugin of this.toInit) {
      plugin.initialize();
      this.plugins.push(plugin);
    }
    this.toInit = [];
    this.isInitialized = true;
  }

  addPlugin(plugin) {
    if (this.isInitialized) {
      plugin.initialize();
      this.plugins.push(plugin);
    } else {
      this.toInit.push(plugin);
    }
  }
}

const PM = new PluginManager();
export default PM;
