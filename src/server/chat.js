import Plugin from "../shared/plugins/Plugin";
import PM from "../shared/plugins/PluginManager";
import CM from "./ChatManager";
import WM from "../shared/entity/WorldManager";
import Enemy from "../shared/entity/Enemy";
import { iterator } from "lazy-iters";

class ChatPlugin extends Plugin {
  constructor() {
    super("ChatPlugin");
  }

  initialize() {
    super.initialize();

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

    CM.registerCommand(
      "spawnai",
      (id, count) => {
        if (count !== undefined) {
          const num = parseInt(count);
          if (Number.isNaN(num)) {
            throw new Error("Argument must be an integer.");
          }
          for (let i = 0; i < num; i++) {
            const enemy = new Enemy();
            enemy.setPosition(WM.getRandomPoint(40, 40));
            WM.add(enemy);
          }
          CM.info(`Spawned ${num} enemies.`, id);
        } else {
          throw new Error("Must specify an argument.");
        }
      },
      "Spawns the specified number of enemy AI entities.",
      ["spawn"]
    );
    CM.registerCommand(
      "killai",
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
      "Kills all currently active AI entities.",
      ["kill"]
    );
  }
}

PM.addPlugin(new ChatPlugin());
