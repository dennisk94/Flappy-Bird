import Phaser from 'phaser';
import PlayScene from './scenes/PlayScene';
import MenuScene from './scenes/MenuScene';
import PreloadScene from './scenes/PreloadScene';
import ScoreScene from './scenes/ScoreScene';
import PauseScene from './scenes/PauseScene';

const width = 400;
const height = 600;
const birdPosition = {
  x: width * .1,
  y: height / 2,
}

const sharedConfig = {
  width,
  height,
  startPosition: birdPosition
}

const scenes = [ PreloadScene, MenuScene, ScoreScene, PlayScene, PauseScene ];
const initScenes = () => scenes.map( ( Scene ) => new Scene(sharedConfig) );

const config = {
  type: Phaser.AUTO,
  ...sharedConfig,
  pixelArt: true,
  physics: {
    // Manages physics simulation
    default: 'arcade',
    arcade: {
    }
  },
  scene: initScenes(),
}

new Phaser.Game(config);