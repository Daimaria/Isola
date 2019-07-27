//import Phaser from "./phaser.min.js";
import GameScene from "./scenes/GameScene.js";
import PreloadScene from "./scenes/PreloadScene.js";
import BootScene from "./scenes/BootScene.js";
import LobbyScene from "./scenes/LobbyScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: 1000,
  height: 800,
  scene: {
    preload: preload,
    create: create
  }
};

export const game = new Phaser.Game(config);
game.scene.add('PreloadScene', PreloadScene);
game.scene.add('BootScene', BootScene);
game.scene.add('GameScene', GameScene);
game.scene.add('LobbyScene', LobbyScene);

function preload() {
  	game.scene.start('BootScene');
}

function create() {
	console.log("nicht iso");
}