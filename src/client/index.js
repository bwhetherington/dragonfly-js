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

const removeChildren = element => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

const adjustScale = two => {
  const minDimension = Math.min(two.width, two.height);
  two.scene.scale = minDimension / TARGET_SIZE;
};

const initializeLandingPage = game => {
  // if (game) {
  //   game.hidden = true;
  // }

  const modal = document.getElementById("landing-page");
  const form = document.getElementById("join-game");
  form.onsubmit = event => {
    event.preventDefault();

    const name = document.getElementById("name").value;

    CM.name = name;

    const message = {
      type: "JOIN_GAME",
      data: {
        name
      }
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

  const two = new Two({
    fullscreen: true,
    autostart: true,
    type: Two.Types[renderer]
  }).appendTo(element);

  window.addEventListener("resize", () => {
    adjustScale(two);
  });

  adjustScale(two);

  two.scene.translation.set(two.width / 2, two.height / 2);

  const makeLine = (two, x1, y1, x2, y2, color = "#f0f0f0", width = 2) => {
    const line = two.makeLine(x1, y1, x2, y2);
    line.stroke = color;
    line.fill = color;
    line.linewidth = width;
  };

  const makeBounds = (two, x, y, width, height) => {
    const rect = two.makeRectangle(x, y, width, height);
    rect.fill = "white";

    // Define grid
    const GRID_SIZE = 20;

    x -= width / 2;
    y -= height / 2;

    // Horizontal
    for (let i = GRID_SIZE; i <= width - GRID_SIZE; i += GRID_SIZE) {
      makeLine(two, x, y + i, x + width, y + i);
      makeLine(two, x + i, y, x + i, y + height);
    }

    // Define horizontal bars
    const border = two.makeRectangle(
      x + width / 2,
      y + width / 2,
      width,
      height
    );
    border.fill = "rgba(0, 0, 0, 0)";
    border.stroke = "#a0a0a0";
    border.linewidth = 5;
  };

  GM.registerHandler("DEFINE_ARENA", (event, remove) => {
    const { friction, geometry, ice } = event;

    WM.friction = friction;

    WM.icePatches = ice.map(
      ({ x, y, width, height }) => new Rectangle(x, y, width, height)
    );

    WM.setGeomtetry(geometry);

    for (const shape of geometry) {
      const { type, x, y, width, height } = shape;
      switch (type) {
        case "InverseRectangle":
          // An InverseRectangle represents the outer bounds
          makeBounds(two, x, y, width, height);
          break;
        case "Rectangle":
          const rectangle = two.makeRectangle(x, y, width, height);
          rectangle.fill = "lightgrey";
          rectangle.stroke = "#a0a0a0";
          rectangle.linewidth = 5;

          break;
      }
    }

    for (const patch of ice) {
      const { x, y, width, height } = patch;
      const rectangle = two.makeRectangle(x, y, width, height);
      rectangle.fill = "rgba(150, 180, 255, 0.5)";
      rectangle.stroke = "lightgrey";
      rectangle.linewidth = 5;
    }

    WM.initializeGraphics(two);

    remove();
  });

  WM.initialize();

  // Start websocket client
  const client = new GameClient(two);

  client.initialize(element);
  element.focus();

  initializeLandingPage(element);
  CM.initialize(client);
  CM.two = two;

  const timer = new Timer(dt => {
    GM.step(dt);
  });
  timer.start();
};

main().catch(console.log);
