class WorldManager {
  idIndex = 0;
  objects = [];

  /**
   * Generates a new object ID.
   */
  createObjectID() {
    const current = this.idIndex;
    this.idIndex += 1;
    return current;
  }

  /**
   * Adds the specified object to the game.
   * @param object The object to add
   */
  addObject(object) {
    object.id = this.createObjectID();
    this.objects.push(object);
  }

  /**
   * Finds the object with the specified ID, if it exists.
   * @param id The object ID to search for
   */
  getObjectByID(id) {
    for (let i = 0; i < this.objects.length; i++) {
      const object = this.objects[i];
      if (object.id === id) {
        return object;
      }
    }
    return null;
  }

  step(step, dt) {
    for (let i = 0; i < this.objects.length; i++ ) {
      const object = this.objects[i];
      object.step(step, dt);
    }
  }


}

export default WorldManager;