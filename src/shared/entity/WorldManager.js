import GM from "../event/GameManager";
import { diff, isServer, Corner } from "../util/util";
import Rectangle from "../util/Rectangle";
import InverseRectangle from "../util/InverseRectangle";
import Projectile from "../entity/Projectile";
import { Vector } from "twojs-ts";
import Hero from "./Hero";
import SizedQueue from "../util/SizedQueue";
import NM from "../network/NetworkManager";
import SETTINGS from "../util/settings";
import LM from "../network/LogManager";
import Enemy from "./Enemy";
import Laser from "./Laser";
import Explosion from "./Explosion";
import PickUp from "./PickUp";
import HealthPickUp from "./HealthPickUp";
import WeaponPickUp from "./WeaponPickUp";
import Entity from "./Entity";
import Pistol from "./Pistol";
import Shotgun from "./Shotgun";
import Raygun from "./Raygun";
import Madsen from "./Madsen";
import Rocket from "./Rocket";
import Mortar from "./Mortar";
import Quadtree from "@timohausmann/quadtree-js";
import { CollisionGroup } from "./util";
import Geometry from "./Geometry";

class WorldManager {
  constructor() {
    this.entities = {};
    this.entityCount = 0;
    this.deleted = [];
    this.entityGenerator = () => null;
    this.setBounds(0, 0, 500, 500);
    this.geometry = [];
    this.friction = 5;
    this.background = null;
    this.foreground = null;
    this.previousState = [];
    this.entityTable = {};
    this.weaponTable = {};
    if (isServer()) {
      this.previousStates = new SizedQueue(600);
    } else {
      this.previousStates = null;
    }
    this.spawnPoints = [new Vector(0, 0)];
  }

  initializeEntityTypes() {
    this.registerEntity("Entity", Entity);
    this.registerEntity("Hero", Hero);
    this.registerEntity("Projectile", Projectile);
    this.registerEntity("Enemy", Enemy);
    this.registerEntity("Laser", Laser);
    this.registerEntity("Explosion", Explosion);
    this.registerEntity("PickUp", PickUp);
    this.registerEntity("HealthPickUp", HealthPickUp);
    this.registerEntity("WeaponPickUp", WeaponPickUp);
    this.registerEntity("Geometry", Geometry);
  }

  initializeWeaponTypes() {
    this.registerWeapon("Pistol", Pistol);
    this.registerWeapon("Shotgun", Shotgun);
    this.registerWeapon("Rocket", Rocket);
    this.registerWeapon("Madsen", Madsen);
    this.registerWeapon("Raygun", Raygun);
    this.registerWeapon("Mortar", Mortar);
  }

  registerEntity(type, EntityType) {
    this.entityTable[type] = EntityType;
  }

  registerWeapon(type, WeaponType) {
    this.weaponTable[type] = WeaponType;
  }

  buildNavMesh(geometry) {}

  *getEntities() {
    for (const id in this.entities) {
      yield this.entities[id];
    }
  }

  *getEntitiesByRadius(point, radius) {
    for (const entity of this.getEntities()) {
      if (entity.isCollidable) {
        if (entity.position.distance(point) <= radius) {
          yield entity;
        }
      }
    }
  }

  remove(entity) {
    if (this.graphicsLayers) {
      const layer = this.getLayer(entity);
      layer.remove(entity.graphicsObject);
    }
  }

  getLayer(entity) {
    const { collisionGroup } = entity;
    return this.graphicsLayers[entity];
  }

  initializeGraphics(two) {
    // Create layers
    this.graphicsLayers = [];
    for (const layer of Object.values(CollisionGroup)) {
      this.graphicsLayers[layer] = two.makeGroup();
    }

    for (const id in this.entities) {
      this.entities[id].initializeGraphicsInternal(two);
    }
  }

  setEntityGenerator(generator) {
    this.entityGenerator = generator;
  }

  setSpawnPoints(spawnPoints) {
    this.spawnPoints = spawnPoints;
  }

  getSpawnPoint(index) {
    const len = this.spawnPoints.length;
    const defaultPoint = new Vector(0, 0);
    if (len > 0) {
      return this.spawnPoints[index % len] || defaultPoint;
    } else {
      return defaultPoint;
    }
  }

  addGeometry(data) {
    const shape = this.makeGeometry(data);
    if (shape !== null) {
      const geom = new Geometry();
      const x = shape.getCenterX();
      const y = shape.getCenterY();
      geom.setShape(shape);
      geom.setPositionXY(x, y);
      this.add(geom);
      return geom;
    } else {
      return null;
    }
  }

  makeGeometry(shape) {
    const { type, x, y, width, height } = shape;
    switch (type) {
      case "Rectangle":
        return new Rectangle(x, y, width, height);
      case "InverseRectangle":
        this.setBounds(x, y, width, height);
        return new InverseRectangle(x, y, width, height);
      default:
        return null;
    }
  }

  setGeometry(geometry) {
    for (const shape of geometry) {
      this.addGeometry(shape);
    }
  }

  getRandomPoint(w = 0, h = 0) {
    const { x, y, width, height } = this.bounds;

    let rx,
      ry,
      notFound = true;

    // If there are no valid spots, this will hang
    while (notFound) {
      rx = Math.random() * width + x;
      ry = Math.random() * height + y;

      let rect = null;

      if (!(w === 0 || h === 0)) {
        rect = new Rectangle(rx, ry, w, h);
      }

      notFound = false;
      for (const shape of this.geometry) {
        const condition =
          (rect !== null && shape.intersects(rect)) ||
          shape.containsPoint(rx, ry);
        if (condition) {
          notFound = true;
          // break;
        }
      }
    }
    return new Vector(rx, ry);
  }

  initialize() {
    GM.registerHandler("STEP", ({ step, dt }) => {
      this.step(step, dt);
    });
    this.initializeEntityTypes();
    this.initializeWeaponTypes();
  }

  findByID(id) {
    return this.entities[id] || null;
  }

  add(entity) {
    this.entities[entity.id] = entity;
    this.entityCount += 1;

    const event = {
      type: "CREATE_OBJECT",
      data: {
        object: entity,
      },
    };

    GM.emitEvent(event);
  }

  step(step, dt) {
    // Update all entities

    // for (const entity of this.getEntities()) {
    //   this.move(entity, dt);
    // }
    this.moveAll(dt);

    for (const id in this.entities) {
      const entity = this.entities[id];
      if (entity.markedForDelete) {
        entity.cleanup();
        this.deleted.push(id);
        if (delete this.entities[id]) {
          this.entityCount -= 1;
        }
      } else {
        entity.step(step, dt);
      }
    }
  }

  recordState() {
    if (this.previousStates) {
      // Save this step
      const objects = [];
      for (const object of this.getEntities()) {
        objects.push(object.serialize());
      }

      // Store state for rollback
      const state = {
        time: GM.timeElapsed,
        step: GM.stepCount,
        state: objects,
      };
      this.previousStates.enqueue(state);
    }
  }

  includeGeometry() {
    for (const shape of this.geometry) {
      this.tree.insert(shape);
    }
  }

  shuntOutOfInverse(entity, other) {
    const box = entity.boundingBox;
    const { x, y } = entity.position;

    const x1 = box.x;
    const x2 = box.x + box.width;
    const y1 = box.y;
    const y2 = box.y + box.height;

    const ox1 = other.x;
    const ox2 = other.x + other.width;
    const oy1 = other.y;
    const oy2 = other.y + other.height;

    let dx = 0;
    let dy = 0;

    if (x1 < ox1) {
      dx = ox1 - x1;
    }
    if (x2 > ox2) {
      dx = ox2 - x2;
    }
    if (y1 < oy1) {
      dy = oy1 - y1;
    }
    if (y2 > oy2) {
      dy = oy2 - y2;
    }

    if (Math.abs(dx) > 0) {
      entity.velocity.x = -entity.bounce * entity.velocity.x;
    }

    if (Math.abs(dy) > 0) {
      entity.velocity.y = -entity.bounce * entity.velocity.y;
    }

    entity.addPositionXY(dx, dy);
  }

  shuntOutOf(entity, other) {
    const box = entity.boundingBox;
    const { x, y } = entity.position;

    const x1 = box.x;
    const x2 = box.x + box.width;
    const y1 = box.y;
    const y2 = box.y + box.height;

    const ox1 = other.x;
    const ox2 = other.x + other.width;
    const oy1 = other.y;
    const oy2 = other.y + other.height;

    let dx = 0;
    let dy = 0;

    let xAxis = 0;
    let yAxis = 0;

    if (x2 > ox2 && x1 < ox2) {
      dx += ox2 - x1;
      xAxis = 1;
    }

    if (x1 < ox1 && x2 > ox1) {
      dx += ox1 - x2;
      xAxis = -1;
    }

    if (y2 > oy2 && y1 < oy2) {
      dy += oy2 - y1;
      yAxis = 1;
    }

    if (y1 < oy1 && y2 > oy1) {
      dy += oy1 - y2;
      yAxis = -1;
    }

    if (Math.abs(dx) > 0 && Math.abs(dy) > 0) {
      // Get the closest corner to the collision
      const cx = other.getCenterX();
      const cy = other.getCenterY();
      const hw = other.width / 2;
      const hh = other.height / 2;
      const cornerX = cx + xAxis * hw;
      const cornerY = cy + yAxis * hh;

      const thisCornerX = x - xAxis * (box.width / 2);
      const thisCornerY = y - yAxis * (box.height / 2);

      // // Check quadrant
      const cornerDX = Math.abs(cornerX - thisCornerX);
      const cornerDY = Math.abs(cornerY - thisCornerY);
      if (cornerDX > cornerDY) {
        dx = 0;
      } else {
        dy = 0;
      }
    }

    if (Math.abs(dx) > 0) {
      entity.velocity.x = -entity.bounce * entity.velocity.x;
    }

    if (Math.abs(dy) > 0) {
      entity.velocity.y = -entity.bounce * entity.velocity.y;
    }

    entity.addPositionXY(dx, dy);
  }

  moveEntity(entity, dt) {
    let { friction } = this;
    entity.vectorBuffer1.set(entity.acceleration);
    entity.vectorBuffer1.scale(entity.friction * friction * dt);

    // v += a * t
    entity.velocity.add(entity.vectorBuffer1);
    // if (entity.isCollidable) {
    //   entity.velocity.addXY(0, 700 * dt);
    // }

    entity.vectorBuffer1.set(entity.velocity);

    // Calculate friction and apply to velocity
    // friction = -µ * v * t
    entity.vectorBuffer1.scale(-entity.friction * friction * dt);

    // velocity += friction
    entity.velocity.add(entity.vectorBuffer1);

    if (entity.velocity.magnitude < 0.1) {
      entity.velocity.setXY(0, 0);
    }
    entity.vectorBuffer1.set(entity.velocity);
    entity.vectorBuffer1.scale(dt);
    entity.addPosition(entity.vectorBuffer1);

    if (entity.isCollidable) {
      this.tree.insert(entity.boundingBox);
    }
  }

  raycast(x, y, r, direction, ignore = [], cb = () => {}, maxIters = 1000) {
    const rect = new Rectangle(x, y, r, r);
    for (let i = 0; i < maxIters; i++) {
      const candidates = this.tree.retrieve(rect);
      for (const candidate of candidates) {
        if (candidate.intersects(rect)) {
          const { parent } = candidate;
          if (parent !== undefined) {
            if (!ignore.includes(parent)) {
              const entity = this.findByID(parent);
              if (entity && !entity.isSpectral) {
                cb(new Vector(rect.getCenterX(), rect.getCenterY()), entity);
                return true;
              }
            }
          } else {
            // Geometry collision
            cb(new Vector(rect.getCenterX(), rect.getCenterY()), null);
            return true;
          }
        }
      }
      rect.add(direction, r);
    }
    return false;
  }

  moveAll(dt) {
    this.tree.clear();
    this.includeGeometry();

    // Process each entity
    for (const entity of this.getEntities()) {
      this.moveEntity(entity, dt);
    }

    // Check for collisions
    for (const entity of this.getEntities()) {
      if (
        entity.isCollidable &&
        entity.collisionGroup !== CollisionGroup.GEOMETRY
      ) {
        // Get possible collisions
        const candidates = this.tree.retrieve(entity.boundingBox);
        for (const other of candidates) {
          const otherParent = other.parent && this.entities[other.parent];
          let ignore = false;
          if (otherParent) {
            // console.log("other entity", otherParent);
            ignore = entity.isSpectral && otherParent.isSpectral;
          }
          if (
            !ignore &&
            other !== entity.boundingBox &&
            other.intersects(entity.boundingBox)
          ) {
            if (other.parent !== undefined) {
              if (
                !(entity.isSpectral && otherParent.isSpectral) &&
                entity.collisionGroup !== CollisionGroup.GEOMETRY
              ) {
                const group = otherParent.collisionGroup;
                switch (group) {
                  case CollisionGroup.GEOMETRY:
                    // Geometry collision
                    const geomEvent = {
                      type: "GEOMETRY_COLLISION",
                      data: {
                        object: entity,
                        other,
                      },
                    };
                    GM.emitEvent(geomEvent);

                    // Shunt object out of geometry
                    switch (other.type) {
                      case "Rectangle":
                        this.shuntOutOf(entity, other);
                        break;
                      case "InverseRectangle":
                        this.shuntOutOfInverse(entity, other);
                        break;
                    }
                    break;
                  case CollisionGroup.ENTITY:
                    // Entity collision
                    const event = {
                      type: "OBJECT_COLLISION",
                      data: {
                        object1: entity,
                        object2: otherParent,
                      },
                    };
                    GM.emitEvent(event);
                    break;
                }
              }
            } else {
              // // Geometry collision
              // const event = {
              //   type: "GEOMETRY_COLLISION",
              //   data: {
              //     object: entity,
              //     other,
              //   },
              // };
              // GM.emitEvent(event);
              // // Shunt object out of geometry
              // switch (other.type) {
              //   case "Rectangle":
              //     this.shuntOutOf(entity, other);
              //     break;
              //   case "InverseRectangle":
              //     this.shuntOutOfInverse(entity, other);
              //     break;
              // }
              // const { velocity } = thisParent;
            }
          }
        }
      }
    }
  }

  move(entity, dt, ignore = []) {
    console.error("THIS SHOULD NOT BE CALLED");
    // vb1 = a * t
    let { friction } = this;
    const { boundingBox } = entity;

    // if (entity.friction > 0) {
    //   for (const icePatch of this.icePatches) {
    //     if (icePatch.intersects(boundingBox)) {
    //       friction /= 20;
    //       break;
    //     }
    //   }
    // }

    entity.vectorBuffer1.set(entity.acceleration);
    entity.vectorBuffer1.scale(entity.friction * friction * dt);

    // v += a * t
    entity.velocity.add(entity.vectorBuffer1);

    entity.vectorBuffer1.set(entity.velocity);

    // Calculate friction and apply to velocity
    // friction = -µ * v * t
    entity.vectorBuffer1.scale(-entity.friction * friction * dt);

    // velocity += friction
    entity.velocity.add(entity.vectorBuffer1);

    if (entity.velocity.magnitude < 0.1) {
      entity.velocity.setXY(0, 0);
    }

    entity.vectorBuffer1.set(entity.velocity);
    entity.vectorBuffer1.scale(dt);

    // Do full movement at once if no collision
    if (!entity.isCollidable) {
      entity.addPosition(entity.vectorBuffer1);
      return false;
    }

    // Use movement steps
    const STEPS = 2;

    // Calculate number of steps based on the size of the hitbox and the speed
    // Max step size is now 1/2 the size of the hitbox
    // const size = boundingBox.diagonal;
    // const speed = entity.vectorBuffer1.magnitude;
    // const STEPS = Math.max(1, Math.floor((size / speed) * 2));

    entity.vectorBuffer1.scale(1 / STEPS);

    let collidedX = false;
    let collidedY = false;
    let collidedEntities = {};

    // Check collision with level geometry

    for (let i = 0; i < STEPS; i++) {
      // Attempt to move along X axis
      if (!collidedX) {
        const { x: oldX } = entity.position;
        entity.addPositionXY(entity.vectorBuffer1.x, 0);

        for (let j = 0; j < this.geometry.length; j++) {
          const shape = this.geometry[j];
          if (shape.intersects(entity.boundingBox)) {
            // Then we cannot move here
            // Revert to last valid position
            // Emit collision event
            entity.setPositionXY(oldX, entity.position.y);
            entity.velocity.setXY(
              entity.velocity.x * -entity.bounce,
              entity.velocity.y
            );
            collidedX = true;
            break;
          }
        }
      }

      if (!collidedY) {
        const { y: oldY } = entity.position;
        entity.addPositionXY(0, entity.vectorBuffer1.y);

        for (let j = 0; j < this.geometry.length; j++) {
          const shape = this.geometry[j];
          if (shape.intersects(entity.boundingBox)) {
            // Then we cannot move here
            // Revert to last valid position
            entity.setPositionXY(entity.position.x, oldY);
            entity.velocity.setXY(
              entity.velocity.x,
              entity.velocity.y * -entity.bounce
            );
            collidedY = true;
            break;
          }
        }
      }

      // Check for collision with other entities
      for (const id in this.entities) {
        if (id !== entity.id && !ignore.includes(id)) {
          const otherEntity = this.findByID(id);
          if (!otherEntity.isCollidable) {
            continue;
          }
          if (entity.isSpectral && otherEntity.isSpectral) {
            continue;
          }
          if (otherEntity instanceof Projectile) {
            continue;
          }
          if (entity.boundingBox.intersects(otherEntity.boundingBox)) {
            collidedEntities[id] = otherEntity;
          }
        }
      }
    }

    let hadCollision = false;

    if (collidedX || collidedY) {
      const event = {
        type: "GEOMETRY_COLLISION",
        data: {
          object: entity,
        },
      };
      GM.emitEvent(event);
      hadCollision = true;
    }

    for (const id in collidedEntities) {
      const event = {
        type: "OBJECT_COLLISION",
        data: {
          object1: entity,
          object2: collidedEntities[id],
        },
      };
      GM.emitEvent(event);

      // If it was not an ignored entity
      hadCollision = true;
    }

    return hadCollision;
  }

  setBounds(x, y, width, height) {
    this.bounds = { x: x - width / 2, y: y - height / 2, width, height };
    if (this.tree instanceof Quadtree) {
      this.tree.clear();
    }
    this.tree = new Quadtree(this.bounds);
  }

  getStateAtTime(time) {
    const toAddBack = new Array(this.previousStates.size);
    let foundState = null;
    for (let i = this.previousStates.size - 1; i >= 0; i--) {
      const state = this.previousStates.pop();

      toAddBack[i] = state;
      if (state.time <= time) {
        // We good
        foundState = state;
        // this.previousStates.push(foundState);
        break;
      }
    }

    if (foundState) {
      return foundState;
    } else {
      // Add the states back to the queue
      for (const state of toAddBack) {
        this.previousStates.push(state);
      }
      return null;
    }
  }

  rollbackFrom(time, event = null) {
    // Revert to the state
    if (SETTINGS.timeWarpEnabled) {
      const state = this.getStateAtTime(time);
      if (state) {
        // const logStatements = [];
        // const oldState = this.serializeAll();

        const oldEventQueue = GM.eventQueue.toArray();
        while (!GM.eventQueue.isEmpty()) {
          GM.eventQueue.pop();
        }

        this.revertState(state);

        // Figure out which events to replay
        const events = [];
        for (const event of GM.eventsAfterTime(state.time)) {
          events.push(event);
        }

        GM.rollback = true;

        // Insert the event at the appropriate time
        if (event) {
          GM.emitEvent(event);
        }

        const times = [];

        // logStatements.push(['replay', events]);

        for (const event of events) {
          times.push(event.time);
          if (event.type === "STEP") {
            GM.step(event.data.dt, event.id);
          } else {
            GM.emitEvent(event);
          }
        }

        // We may have events remaining in the queue from after the last step
        // event, so we poll events to run any that are still there.
        GM.pollEvents();

        GM.rollback = false;

        // const newState = this.serializeAll();
        // const stateDiff = deepDiff(oldState, newState, ['type']);

        // logStatements.push(['diff', stateDiff]);

        // Add back the stored events
        for (const event of oldEventQueue) {
          GM.emitEvent(event);
        }

        // if (Object.keys(stateDiff).length > 0) {
        //   // Log everything
        //   NM.logOptions(logStatements, {
        //     pre: true,
        //     batch: true
        //   });
        // }

        this.sync(NM.node, -1, true, true);
        return true;
      } else {
        NM.log("Attempted to rollback, but state could not be found");
        // If we did not roll back, still process the event
        if (event) {
          GM.emitEventFirst(event);
        }
        return false;
      }
    } else {
      if (event) {
        GM.emitEventFirst(event);
      }
      return false;
    }
  }

  deleteAllEntities() {
    for (const id in this.entities) {
      this.entities[id].cleanup();
      this.deleted.push(id);
      if (delete this.entities[id]) {
        this.entityCount -= 1;
      }
    }
  }

  revertState(state) {
    const ids = {};

    GM.timeElapsed = state.time;
    GM.stepCount = state.step;

    // Sync all objects
    for (const obj of state.state) {
      this.receiveSyncObject(obj);
      ids[obj.id] = true;
    }

    // Remove all other objects
    for (const entity of this.getEntities()) {
      if (!ids[entity.id]) {
        entity.markForDelete();
      }
    }
  }

  createEntity(type) {
    const EntityType = this.entityTable[type];
    if (EntityType) {
      const entity = new EntityType();
      return entity;
    } else {
      return null;
    }
  }

  /**
   *
   */
  serializeArray() {
    const batch = [];
    for (const entity of this.getEntities()) {
      batch.push(entity.serialize());
    }
    return batch;
  }

  serializeAll() {
    const batch = {};
    for (const id in this.entities) {
      batch[id] = this.findByID(id).serialize();
    }
    return batch;
  }

  /**
   * Syncs the state of the world to the specified socket using the specified
   * server. If the `forceSync` parameter is set to `true`, the current state
   * will be synced in full. If it is `false`, only the changes since the last
   * state will be synced.
   * @param server The server to send the sync message from
   * @param socket The socket to send the sync message to
   * @param forceSync Whether or not to sync the full world state
   */
  sync(server, socket = -1, forceSync = false, forceDelete = false) {
    if (server.numConnections > 0) {
      const batch = [];
      if (forceSync) {
        for (const entity of this.getEntities()) {
          if (entity.doSynchronize) {
            batch.push(entity.serialize());
          }
        }
      } else {
        // Check each object against the previous state
        const state = {};
        for (const entity of this.getEntities()) {
          // Only synchronize entities with synchronize enabled
          if (entity.doSynchronize) {
            const serialized = entity.serialize();
            if (serialized) {
              // Add it to the state
              state[entity.id] = serialized;

              // Compare it to the previous state
              const previous = this.previousState[entity.id];

              if (previous !== undefined) {
                // Only record diffs
                // console.log(previous, serialized);
                const change = diff(previous, serialized);
                if (Object.keys(change).length > 0) {
                  change.id = serialized.id;
                  batch.push(change);
                } else {
                  // Objects are identical; do nothing
                }
              } else {
                // New entity
                batch.push(serialized);
              }
            }
          }
        }
        this.previousState = state;
      }

      if (batch.length > 0) {
        NM.send(
          {
            type: "SYNC_OBJECT_BATCH",
            data: {
              time: GM.timeElapsed,
              objects: batch,
            },
          },
          socket
        );
      }
      if (this.deleted.length > 0) {
        NM.send(
          {
            type: "SYNC_DELETE_OBJECT_BATCH",
            data: {
              ids: this.deleted,
              forceDelete,
            },
          },
          socket
        );
        this.deleted = [];
      }
    }
  }

  getEntityCount() {
    return this.entityCount;
  }

  syncObjectServer(object) {
    const packet = {
      type: "SYNC_OBJECT",
      data: {
        time: GM.timeElapsed,
        object: object.serialize(),
      },
    };
    NM.send(packet);
  }

  /**
   * Receives a sync object request, either creating a new entity if it does
   * not already exist, or updating the existing entity. If a time is supplied,
   * it can be used for opponent prediction by moving the entity forward by the
   * time difference.
   * @param object The serialized object to sync
   * @param time The time when the sync object request was made
   */
  receiveSyncObject(object, time) {
    let existing = this.findByID(object.id);
    let created = false;
    if (!existing) {
      const newObject = this.createEntity(object.type);
      if (newObject) {
        newObject.setID(object.id);
        existing = newObject;
        created = true;
      }
    }
    if (existing) {
      existing.deserialize(object);

      // Opponent prediction
      const condition =
        time && // Check that we have a time
        SETTINGS.opponentPredictionEnabled && // Check that opponent prediction is enabled
        existing.doSynchronize && // Check that the object should synchronize
        !(existing instanceof Hero && existing.isCurrentHero()); // Check that it isn't the current hero
      if (condition) {
        const dt = GM.timeElapsed - time;
        existing.predictMovement(dt);
      }

      if (created) {
        this.add(existing);
      }
    }
  }

  deleteAllNonHero() {
    for (const key in this.entities) {
      const entity = this.entities[key];
      if (!(entity instanceof Hero)) {
        entity.markForDelete();
      }
    }
  }

  createWeapon(type) {
    const WeaponType = this.weaponTable[type];
    if (WeaponType) {
      return new WeaponType();
    } else {
      return null;
    }
  }
}

const WM = new WorldManager();
export default WM;
