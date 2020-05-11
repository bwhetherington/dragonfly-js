class Plugin {
  constructor(name = "UnnamedPlugin") {
    this.name = name;
  }

  initialize() {
    console.log(`Initialized ${this.name}`);
  }
}

export default Plugin;
