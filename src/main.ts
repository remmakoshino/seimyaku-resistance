import Phaser from 'phaser';
import { GAME, COLORS } from './utils/constants';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { BattleScene } from './scenes/BattleScene';
import { ExplorationScene } from './scenes/ExplorationScene';
import { ResultScene } from './scenes/ResultScene';
import { StoryScene } from './scenes/StoryScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: COLORS.BG,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: 1080,
      height: 1920
    }
  },
  scene: [
    BootScene,
    TitleScene,
    CharacterSelectScene,
    ExplorationScene,
    BattleScene,
    ResultScene,
    StoryScene,
  ],
  render: {
    pixelArt: false,
    antialias: true,
  },
  input: {
    touch: true,
  },
};

const game = new Phaser.Game(config);

// 画面回転対応
function handleOrientationChange(): void {
  const isPortrait = window.innerHeight > window.innerWidth;
  if (isPortrait) {
    game.scale.setGameSize(GAME.WIDTH, GAME.HEIGHT);
  } else {
    game.scale.setGameSize(GAME.LANDSCAPE_WIDTH, GAME.LANDSCAPE_HEIGHT);
  }
}

window.addEventListener('orientationchange', () => {
  setTimeout(handleOrientationChange, 100);
});

const mediaQuery = window.matchMedia('(orientation: portrait)');
mediaQuery.addEventListener('change', handleOrientationChange);

export default game;
