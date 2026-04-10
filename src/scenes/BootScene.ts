import Phaser from 'phaser';
import { SCENES, GAME } from '../utils/constants';
import { SpriteGenerator, CHARACTER_CONFIGS } from '../utils/SpriteGenerator';
import { EnemyGenerator } from '../characters/EnemyGenerator';
import { ENEMIES, BOSSES } from '../characters/EnemyData';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.BOOT });
  }

  preload(): void {
    const { width, height } = this.scale.gameSize;
    const cx = width / 2;
    const cy = height / 2;

    // ローディング画面
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1B2838, 0.8);
    progressBox.fillRect(cx - 160, cy - 15, 320, 30);

    const loadingText = this.add.text(cx, cy - 50, '星脈のレジスタンス', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: '28px',
      color: '#00E676',
    }).setOrigin(0.5);

    const percentText = this.add.text(cx, cy, '0%', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: '18px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00E676, 1);
      progressBar.fillRect(cx - 155, cy - 10, 310 * value, 20);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // ダミーロード（テクスチャ生成の時間確保）
    // 実際のアセットはCanvas APIで動的生成するため、ここでは不要
  }

  create(): void {
    // キャラクターテクスチャ生成
    const charSize = 120;
    for (const [id, config] of Object.entries(CHARACTER_CONFIGS)) {
      SpriteGenerator.generateCharacterTexture(this, config, charSize, charSize * 2, `char_${id}`);
      // フィールド用小サイズも生成
      const fieldConfig = { ...config, scale: 0.6 };
      SpriteGenerator.generateCharacterTexture(this, fieldConfig, 60, 80, `char_${id}_field`);
      // フィールド用歩行フレーム生成 (4フレーム: 立ち, 左足前, 立ち, 右足前)
      SpriteGenerator.generateWalkFrames(this, fieldConfig, 60, 80, `char_${id}_walk`);
    }

    // 敵テクスチャ生成
    const enemySize = 100;
    for (const [id, enemy] of Object.entries(ENEMIES)) {
      EnemyGenerator.generateEnemyTexture(this, enemy.category, id, enemySize, enemySize);
    }
    // ボステクスチャ
    for (const [id, boss] of Object.entries(BOSSES)) {
      EnemyGenerator.generateEnemyTexture(this, 'boss', id, 150, 200);
    }

    // タイトルへ遷移
    this.scene.start(SCENES.TITLE);
  }
}
