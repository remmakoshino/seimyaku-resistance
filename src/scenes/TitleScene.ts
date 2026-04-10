import Phaser from 'phaser';
import { SCENES, GAME, COLORS } from '../utils/constants';
import { audioGenerator } from '../utils/AudioGenerator';
import { SaveSystem } from '../systems/SaveSystem';

export class TitleScene extends Phaser.Scene {
  private particles: { x: number; y: number; vx: number; vy: number; alpha: number; size: number }[] = [];

  constructor() {
    super({ key: SCENES.TITLE });
  }

  create(): void {
    const { width, height } = this.scale.gameSize;

    // 背景
    this.cameras.main.setBackgroundColor(COLORS.BG);

    // 星脈パーティクル
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 1.5 - 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        size: Math.random() * 3 + 1,
      });
    }

    // タイトルロゴ
    const titleY = height * 0.22;
    this.add.text(width / 2, titleY, '星脈のレジスタンス', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(width * 0.08)}px`,
      color: '#00E676',
      fontStyle: 'bold',
      stroke: '#003322',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, titleY + height * 0.06, 'SEIMYAKU RESISTANCE', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(width * 0.035)}px`,
      color: '#C0C0D0',
      letterSpacing: 4,
    }).setOrigin(0.5);

    // サブタイトル
    this.add.text(width / 2, titleY + height * 0.1, '— 惑星の命を、取り戻せ —', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(width * 0.035)}px`,
      color: '#88AACC',
    }).setOrigin(0.5);

    // メニューボタン
    const menuY = height * 0.55;
    const buttonW = width * 0.5;
    const buttonH = height * 0.06;
    const gap = height * 0.08;

    // はじめから
    this.createMenuButton(width / 2, menuY, buttonW, buttonH, 'はじめから', () => {
      audioGenerator.playConfirmSE();
      const save = SaveSystem.getDefaultSave();
      SaveSystem.save(save);
      this.scene.start(SCENES.STORY, { chapter: 1, saveData: save });
    });

    // つづきから
    const hasSave = SaveSystem.hasSave();
    this.createMenuButton(width / 2, menuY + gap, buttonW, buttonH, 'つづきから', () => {
      if (!hasSave) return;
      audioGenerator.playConfirmSE();
      const save = SaveSystem.load()!;
      this.scene.start(SCENES.CHARACTER_SELECT, { saveData: save });
    }, hasSave ? 1.0 : 0.4);

    // 音楽を有効化（ユーザーインタラクション後）
    this.input.once('pointerdown', () => {
      audioGenerator.resume();
      audioGenerator.playTitleBGM();
    });

    // 画面タップ案内
    const tapText = this.add.text(width / 2, height * 0.85, 'タップして音楽を再生', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(width * 0.03)}px`,
      color: '#666688',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: tapText,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // コピーライト
    this.add.text(width / 2, height * 0.93, '© 2026 星脈のレジスタンス制作チーム', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(width * 0.025)}px`,
      color: '#444466',
    }).setOrigin(0.5);
  }

  private createMenuButton(
    x: number, y: number, w: number, h: number,
    label: string, callback: () => void, alpha = 1.0,
  ): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x0D1117, 0.85);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    bg.lineStyle(2, 0x00E676, alpha);
    bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);

    const text = this.add.text(x, y, label, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(h * 0.5)}px`,
      color: '#FFFFFF',
    }).setOrigin(0.5).setAlpha(alpha);

    const hitArea = this.add.rectangle(x, y, w, h).setInteractive().setAlpha(0.001);
    hitArea.on('pointerover', () => {
      if (alpha < 1) return;
      bg.clear();
      bg.fillStyle(0x1B2838, 0.95);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      bg.lineStyle(2, 0x00E676, 1);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x0D1117, 0.85);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      bg.lineStyle(2, 0x00E676, alpha);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    });
    hitArea.on('pointerdown', () => {
      audioGenerator.playCursorSE();
      callback();
    });
  }

  update(): void {
    // パーティクル更新 — Canvasで描画する代わりにPhaserのgraphicsで
    const g = this.add.graphics();
    g.clear();
    const { width, height } = this.scale.gameSize;

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.002;

      if (p.y < 0 || p.alpha <= 0) {
        p.x = Math.random() * width;
        p.y = height + 10;
        p.alpha = Math.random() * 0.8 + 0.2;
      }

      g.fillStyle(0x00E676, p.alpha);
      g.fillCircle(p.x, p.y, p.size);
    }
  }
}
