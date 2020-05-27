import Plugin from "../shared/plugins/Plugin";
import PM from "../shared/plugins/PluginManager";
import CM from "./ChatManager";
import WM from "../shared/entity/WorldManager";
import Enemy from "../shared/entity/Enemy";
import { iterator } from "lazy-iters";
import SM from "./StressManager";
import PickUp from "../shared/entity/PickUp";
import Hero from "../shared/entity/Hero";

class ChatPlugin extends Plugin {
  constructor() {
    super("ChatPlugin");
  }

  initialize() {
    super.initialize();

    CM.registerCommand("stress", (id) => {
      const level = SM.getStress();
      const label = Math.round(level * 1000) / 10;

      const mem =
        Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 10) / 10;

      const message = `Stress = ${label}%, Memory = ${mem}MB`;
      if (level > 0.5) {
        CM.warn(message, id);
      } else {
        CM.info(message, id);
      }
    });

    CM.registerCommand("weapons", () => {
      // Remove all player weapons
      WM.getEntities()
        .filter((entity) => entity instanceof Hero)
        .forEach((hero) => {
          hero.setWeapon("Pistol");
        });

      // Destroy all pickups on the map
      WM.getEntities()
        .filter((entity) => entity instanceof PickUp)
        .forEach((entity) => {
          entity.markForDelete();
        });

      // Respawn pickups
      CM.server.generatePickups();

      CM.info("Weapons reset.");
    });

    CM.registerCommand("roll", (id, die) => {
      if (die !== undefined) {
        const dieNum = parseInt(die);
        if (!Number.isNaN(dieNum)) {
          const roll = Math.floor(Math.random() * dieNum) + 1;
          const hero = CM.server.getPlayerEntity(id);
          const { name } = hero;
          CM.info(`${name} has rolled a ${roll}. [1-${dieNum}]`);
        } else {
          throw new Error("Die must be an integer.");
        }
      } else {
        throw new Error("Die must be specified.");
      }
    });

    CM.registerCommand("sudo", (_, ...args) => {
      const [id, cmd, ...rest] = args;
      CM.runCommand(id, cmd, rest);
    });

    CM.registerCommand("regen", (id) => {
      if (CM.server) {
        const hero = CM.server.getPlayerEntity(id);
        if (hero.regen) {
          hero.regen = 0;
          CM.info("Regeneration disabled.", id);
        } else {
          hero.regen = 5;
          CM.info("Regeneration enabled.", id);
        }
      }
    });

    CM.registerCommand("equip", (id, weapon) => {
      if (typeof weapon === "string") {
        if (CM.server) {
          const hero = CM.server.getPlayerEntity(id);
          hero.setWeapon(weapon);
        }
      }
    });

    CM.registerCommand("collision", (id) => {
      const hero = CM.server.getPlayerEntity(id);
      hero.isCollidable = !hero.isCollidable;
    });

    CM.registerCommand(
      "spawn",
      (id, count) => {
        if (count !== undefined) {
          const num = parseInt(count);
          if (Number.isNaN(num)) {
            throw new Error("Argument must be an integer.");
          }
          for (let i = 0; i < num; i++) {
            const enemy = new Enemy();
            enemy.setPosition(WM.getRandomPoint(40, 40));

            enemy.weapon.delayTimer = Math.random() * 5;

            WM.add(enemy);
          }
          CM.info(`Spawned ${num} enemies.`, id);
        } else {
          throw new Error("Must specify an argument.");
        }
      },
      "Spawns the specified number of enemy AI entities."
    );
    CM.registerCommand(
      "kill",
      (id) => {
        const deleted = iterator(WM.getEntities())
          .filter((entity) => entity.type === "Enemy")
          .map((entity) => {
            entity.markForDelete();
            return 1;
          })
          .sum();
        if (deleted === 0) {
          CM.warn("No entities deleted.", id);
        } else {
          CM.info("Killed all AI entities.", id);
        }
      },
      "Kills all currently active AI entities."
    );
  }
}

PM.addPlugin(new ChatPlugin());
