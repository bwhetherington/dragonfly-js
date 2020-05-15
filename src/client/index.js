import Two from "twojs-ts";
import "./index.css";
import GameClient from "./GameClient";
import WM from "../shared/entity/WorldManager";
import GM from "../shared/event/GameManager";
import NM from "../shared/network/NetworkManager";
import Rectangle from "../shared/util/Rectangle";
import CM from "./ChatManager";
import InverseRectangle from "../shared/util/InverseRectangle";
import Timer from "./timer";
import { parseLocation } from "./util";
import HealthPickUp from "../shared/entity/HealthPickUp";
import { color, getFill, getStroke } from "../shared/util/color";
import { CollisionGroup } from "../shared/entity/util";

const GEOM_COLOR = color(220, 220, 220);
const GEOM_FILL = getFill(GEOM_COLOR);
const GEOM_STROKE = getStroke(GEOM_COLOR);

const removeChildren = (element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

const adjustScale = (two) => {
  const minDimension = Math.min(two.width, two.height);
  two.scene.scale = minDimension / TARGET_SIZE;
};

const initializeLandingPage = (game) => {
  // if (game) {
  //   game.hidden = true;
  // }

  const modal = document.getElementById("landing-page");
  const form = document.getElementById("join-game");
  form.onsubmit = (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;

    CM.name = name;

    const message = {
      type: "JOIN_GAME",
      data: {
        name,
      },
    };

    NM.send(message);

    modal.hidden = true;
    if (game) {
      // game.hidden = false;
      game.focus();
    }
  };
  // modal.hidden = true;
};

const TARGET_SIZE = 800;

const main = async () => {
  const element = document.getElementById("game");
  removeChildren(element);

  const query = location.search || "";
  const { renderer = "svg" } = parseLocation(query);

  element.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    return false;
  });

  const two = new Two({
    fullscreen: true,
    autostart: true,
    type: Two.Types[renderer],
  }).appendTo(element);

  WM.initialize();
  WM.initializeGraphics(two);

  window.addEventListener("resize", () => {
    adjustScale(two);
  });

  adjustScale(two);

  two.scene.translation.set(two.width / 2, two.height / 2);

  const makeLine = (two, x1, y1, x2, y2, color = "#f0f0f0", width = 2) => {
    const line = two.makeLine(x1, y1, x2, y2);
    WM.graphicsLayers[CollisionGroup.GEOMETRY].add(line);
    line.stroke = color;
    line.fill = color;
    line.linewidth = width;
  };

  const drawLines = (two, x, y, width, height) => {
    // Define grid
    const GRID_SIZE = 20;

    x -= width;
    y -= height;

    const bg = two.makeRectangle(x + width / 2, y + height / 2, width, height);
    WM.graphicsLayers[CollisionGroup.GEOMETRY].add(bg);
    bg.fill = "white";
    bg.stroke = "rgba(0, 0, 0, 0)";

    // Horizontal
    for (let i = GRID_SIZE; i <= width - GRID_SIZE; i += GRID_SIZE) {
      makeLine(two, x + i, y, x + i, y + height);
    }

    for (let i = GRID_SIZE; i <= height - GRID_SIZE; i += GRID_SIZE) {
      makeLine(two, x, y + i, x + width, y + i);
    }
  };

  GM.registerHandler("DEFINE_ARENA", (event, remove) => {
    const { friction, bounds } = event;
    const { x, y, width, height } = bounds;

    WM.friction = friction;
    // WM.setBounds(bounds);

    drawLines(two, x + width / 2, y + height / 2, width, height);

    remove();
  });

  // Start websocket client
  const client = new GameClient(two);

  client.initialize(element);
  element.focus();

  initializeLandingPage(element);
  CM.initialize(client);
  CM.two = two;

  const timer = new Timer((dt) => {
    GM.step(dt);
  });
  timer.start();

  console.log("Game started.");
};

main().catch(console.log);
