import Phaser from 'phaser';
import { SCENES, GAME, COLORS } from '../utils/constants';
import { SaveData, SaveSystem } from '../systems/SaveSystem';
import { ENEMIES, BOSSES, ENCOUNTER_TABLES } from '../characters/EnemyData';
import { audioGenerator } from '../utils/AudioGenerator';

export class ExplorationScene extends Phaser.Scene {
  private saveData!: SaveData;
  private playerX = 0;
  private stepCount = 0;
  private encounterThreshold = 15;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private bgLayers: Phaser.GameObjects.Graphics[] = [];
  private scrollOffset = 0;
  private moveDirection = 0; // -1:左, 0:停止, 1:右
  private isMoving = false;
  private facingRight = true;
  private moveSpeed = 2.5; // ピクセル/フレーム
  private stepAccumulator = 0;
  private dustParticles: Phaser.GameObjects.Graphics[] = [];
  private shadowGraphics!: Phaser.GameObjects.Graphics;
  private walkFrameKeys: string[] = [];
  private currentWalkFrame = 0;
  private walkFrameTimer = 0;
  private walkFrameInterval = 150; // ms per frame

  constructor() {
    super({ key: SCENES.EXPLORATION });
  }

  init(data: { saveData: SaveData }): void {
    this.saveData = data.saveData;
    this.playerX = 100;
    this.stepCount = 0;
    this.encounterThreshold = 10 + Math.floor(Math.random() * 10);
    this.scrollOffset = 0;
    this.moveDirection = 0;
    this.isMoving = false;
    this.facingRight = true;
    this.stepAccumulator = 0;
    this.walkFrameKeys = [];
    this.currentWalkFrame = 0;
    this.walkFrameTimer = 0;
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    this.cameras.main.setBackgroundColor(COLORS.BG);

    audioGenerator.playTitleBGM(); // フィールドBGMとして使用

    // 背景描画
    this.drawFieldBackground(width, height);

    // チャプター名表示
    const chapterNames = ['', 'アークシティ地下水路', '凍土の村エルドラ', '海上都市マリータ', '浮遊要塞ゼニス', '始原の大空洞'];
    const chapterName = chapterNames[this.saveData.currentChapter] ?? '';

    this.add.text(width / 2, height * 0.03, `第${this.saveData.currentChapter}章: ${chapterName}`, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(width * 0.04)}px`,
      color: '#00E676',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // プレイヤー影
    this.shadowGraphics = this.add.graphics();
    this.shadowGraphics.fillStyle(0x000000, 0.3);
    this.shadowGraphics.fillEllipse(0, 0, 40, 12);
    this.shadowGraphics.setPosition(this.playerX, height * 0.6 + 35);

    // プレイヤースプライト（歩行アニメーション対応）
    const leaderId = this.saveData.party[0];
    const walkBase = `char_${leaderId}_walk`;
    const fieldKey = `char_${leaderId}_field`;

    // 歩行フレームキー一覧を構築
    this.walkFrameKeys = [];
    for (let f = 0; f < 4; f++) {
      const fk = `${walkBase}_f${f}`;
      if (this.textures.exists(fk)) {
        this.walkFrameKeys.push(fk);
      }
    }

    const initialTexture = this.walkFrameKeys.length > 0
      ? this.walkFrameKeys[0]
      : this.textures.exists(fieldKey) ? fieldKey : '__DEFAULT';

    this.playerSprite = this.add.sprite(this.playerX, height * 0.6, initialTexture);
    if (initialTexture === '__DEFAULT') {
      this.playerSprite.setScale(0.001);
    }

    // フィールドオブジェクト配置
    this.placeFieldObjects(width, height);

    // 操作UI（左右移動ボタン）
    this.createMoveButtons(width, height);

    // メニューボタン
    this.createMenuButton(width, height);

    // ボス挑戦ボタン（フィールド右端）
    this.createBossButton(width, height);
  }

  private drawFieldBackground(w: number, h: number): void {
    const bg = this.add.graphics();

    // 空
    const chapter = this.saveData.currentChapter;
    const skyColors: Record<number, [number, number, number][]> = {
      1: [[15, 20, 35], [30, 35, 55]], // 地下水路（暗い）
      2: [[50, 60, 80], [180, 200, 220]], // 凍土（白っぽい）
      3: [[30, 80, 130], [100, 160, 220]], // 海上（青）
      4: [[40, 30, 60], [80, 60, 100]], // 浮遊要塞（紫がかった）
      5: [[10, 5, 20], [30, 15, 40]], // 大空洞（暗い紫）
    };

    const colors = skyColors[chapter] ?? skyColors[1];
    for (let y = 0; y < h * 0.7; y++) {
      const t = y / (h * 0.7);
      const r = Math.floor(colors[0][0] + (colors[1][0] - colors[0][0]) * t);
      const g = Math.floor(colors[0][1] + (colors[1][1] - colors[0][1]) * t);
      const b = Math.floor(colors[0][2] + (colors[1][2] - colors[0][2]) * t);
      bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      bg.fillRect(0, y, w, 1);
    }

    // 地面
    bg.fillStyle(0x2D2D2D, 1);
    bg.fillRect(0, h * 0.7, w, h * 0.3);
    bg.lineStyle(2, 0x00E676, 0.2);
    bg.lineBetween(0, h * 0.7, w, h * 0.7);

    // 地面の星脈パターン
    bg.lineStyle(1, 0x00E676, 0.08);
    for (let x = 0; x < w; x += 60) {
      bg.lineBetween(x, h * 0.7, x + 10, h);
    }
  }

  private placeFieldObjects(w: number, h: number): void {
    const objectY = h * 0.65;

    // 宝箱
    const chestX = w * 0.4 + Math.random() * w * 0.2;
    const chest = this.add.graphics();
    chest.fillStyle(0x8B4513, 1);
    chest.fillRect(chestX - 15, objectY - 10, 30, 20);
    chest.fillStyle(0xFFD700, 1);
    chest.fillRect(chestX - 3, objectY - 8, 6, 4);
    const chestHit = this.add.rectangle(chestX, objectY, 40, 30).setInteractive().setAlpha(0.001);
    chestHit.on('pointerdown', () => {
      audioGenerator.playConfirmSE();
      // アイテム獲得
      const items = [
        { id: 'potion', name: 'ポーション', description: 'HP30%回復', quantity: 1, type: 'consumable' as const },
        { id: 'ether', name: 'エーテル', description: 'SP30%回復', quantity: 1, type: 'consumable' as const },
      ];
      const item = items[Math.floor(Math.random() * items.length)];
      const existing = this.saveData.inventory.find(i => i.id === item.id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        this.saveData.inventory.push(item);
      }
      SaveSystem.save(this.saveData);

      // 演出
      chest.destroy();
      chestHit.destroy();
      this.showMessage(`${item.name}を手に入れた！`, w, h);
    });

    // セーブポイント
    const saveX = w * 0.7;
    const savePoint = this.add.graphics();
    savePoint.fillStyle(0x00E676, 0.5);
    savePoint.fillCircle(saveX, objectY, 15);
    savePoint.lineStyle(2, 0x00E676, 0.8);
    savePoint.strokeCircle(saveX, objectY, 18);
    const saveHit = this.add.rectangle(saveX, objectY, 40, 40).setInteractive().setAlpha(0.001);
    saveHit.on('pointerdown', () => {
      audioGenerator.playHealSE();
      // 全回復 & セーブ
      for (const char of this.saveData.characters) {
        char.hp = char.maxHp;
        char.sp = char.maxSp;
      }
      SaveSystem.save(this.saveData);
      this.showMessage('セーブしました！ HP/SP全回復！', w, h);
    });
  }

  private createMoveButtons(w: number, h: number): void {
    const btnY = h * 0.88;
    const btnSize = Math.max(GAME.MIN_BUTTON_SIZE, w * 0.14);

    // 左ボタン
    const leftBtn = this.add.graphics();
    leftBtn.fillStyle(0x1B2838, 0.8);
    leftBtn.fillCircle(w * 0.15, btnY, btnSize / 2);
    leftBtn.lineStyle(2, 0x00E676, 0.5);
    leftBtn.strokeCircle(w * 0.15, btnY, btnSize / 2);
    this.add.text(w * 0.15, btnY, '◀', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${btnSize * 0.5}px`,
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const leftHit = this.add.rectangle(w * 0.15, btnY, btnSize * 1.2, btnSize * 1.2).setInteractive().setAlpha(0.001);
    leftHit.on('pointerdown', () => {
      this.moveDirection = -1;
      this.startWalking();
    });
    leftHit.on('pointerup', () => {
      if (this.moveDirection === -1) this.stopWalking();
    });
    leftHit.on('pointerout', () => {
      if (this.moveDirection === -1) this.stopWalking();
    });

    // 右ボタン
    const rightBtn = this.add.graphics();
    rightBtn.fillStyle(0x1B2838, 0.8);
    rightBtn.fillCircle(w * 0.85, btnY, btnSize / 2);
    rightBtn.lineStyle(2, 0x00E676, 0.5);
    rightBtn.strokeCircle(w * 0.85, btnY, btnSize / 2);
    this.add.text(w * 0.85, btnY, '▶', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${btnSize * 0.5}px`,
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const rightHit = this.add.rectangle(w * 0.85, btnY, btnSize * 1.2, btnSize * 1.2).setInteractive().setAlpha(0.001);
    rightHit.on('pointerdown', () => {
      this.moveDirection = 1;
      this.startWalking();
    });
    rightHit.on('pointerup', () => {
      if (this.moveDirection === 1) this.stopWalking();
    });
    rightHit.on('pointerout', () => {
      if (this.moveDirection === 1) this.stopWalking();
    });

    // PC用キーボード操作
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-LEFT', () => {
        this.moveDirection = -1;
        this.startWalking();
      });
      this.input.keyboard.on('keyup-LEFT', () => {
        if (this.moveDirection === -1) this.stopWalking();
      });
      this.input.keyboard.on('keydown-RIGHT', () => {
        this.moveDirection = 1;
        this.startWalking();
      });
      this.input.keyboard.on('keyup-RIGHT', () => {
        if (this.moveDirection === 1) this.stopWalking();
      });
      // A/D キーも対応
      this.input.keyboard.on('keydown-A', () => {
        this.moveDirection = -1;
        this.startWalking();
      });
      this.input.keyboard.on('keyup-A', () => {
        if (this.moveDirection === -1) this.stopWalking();
      });
      this.input.keyboard.on('keydown-D', () => {
        this.moveDirection = 1;
        this.startWalking();
      });
      this.input.keyboard.on('keyup-D', () => {
        if (this.moveDirection === 1) this.stopWalking();
      });
    }
  }

  private startWalking(): void {
    if (this.isMoving) {
      // 移動中に方向変更のみ
      if (this.moveDirection === -1) {
        this.facingRight = false;
        this.playerSprite.setFlipX(true);
      } else if (this.moveDirection === 1) {
        this.facingRight = true;
        this.playerSprite.setFlipX(false);
      }
      return;
    }
    this.isMoving = true;
    this.currentWalkFrame = 0;
    this.walkFrameTimer = 0;

    // 向き変更
    if (this.moveDirection === -1) {
      this.facingRight = false;
      this.playerSprite.setFlipX(true);
    } else if (this.moveDirection === 1) {
      this.facingRight = true;
      this.playerSprite.setFlipX(false);
    }
  }

  private stopWalking(): void {
    this.moveDirection = 0;
    this.isMoving = false;
    this.currentWalkFrame = 0;

    // 静止フレームに戻す
    if (this.walkFrameKeys.length > 0) {
      this.playerSprite.setTexture(this.walkFrameKeys[0]);
    }
  }

  private spawnDustParticle(x: number, y: number): void {
    const dust = this.add.graphics();
    dust.fillStyle(0x888888, 0.4);
    const size = 2 + Math.random() * 3;
    dust.fillCircle(0, 0, size);
    dust.setPosition(x + (Math.random() - 0.5) * 10, y);

    this.tweens.add({
      targets: dust,
      y: dust.y - 10 - Math.random() * 8,
      alpha: 0,
      scaleX: 0.3,
      scaleY: 0.3,
      duration: 400 + Math.random() * 200,
      onComplete: () => dust.destroy(),
    });
  }

  private createMenuButton(w: number, h: number): void {
    const menuBtn = this.add.text(w - 10, 10, '☰', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(w * 0.06)}px`,
      color: '#C0C0D0',
    }).setOrigin(1, 0).setInteractive();

    menuBtn.on('pointerdown', () => {
      this.scene.start(SCENES.CHARACTER_SELECT, { saveData: this.saveData });
    });

    // 星晶石管理ボタン
    const sekiBtn = this.add.text(w - 10, 45, '💎', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(w * 0.05)}px`,
      color: '#00BCD4',
    }).setOrigin(1, 0).setInteractive();

    sekiBtn.on('pointerdown', () => {
      audioGenerator.playCursorSE();
      this.scene.start(SCENES.SEISHOUSEKI, { saveData: this.saveData });
    });
  }

  private createBossButton(w: number, h: number): void {
    const btnX = w * 0.5;
    const btnY = h * 0.75;

    const chapter = this.saveData.currentChapter;
    const bossNames: Record<number, string> = {
      1: 'ガレス',
      2: 'セレーネ',
      3: 'オルガ＆ボリス',
      4: 'ゼノン',
      5: 'ヴァルトール',
    };

    const bossBtn = this.add.text(btnX, btnY, `⚔ ボス: ${bossNames[chapter] ?? '???'}`, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(w * 0.035)}px`,
      color: '#FF4444',
      fontStyle: 'bold',
      backgroundColor: '#1a0000',
      padding: { x: 15, y: 8 },
    }).setOrigin(0.5).setInteractive();

    // 点滅
    this.tweens.add({
      targets: bossBtn,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    bossBtn.on('pointerdown', () => {
      audioGenerator.playConfirmSE();
      this.startBossBattle();
    });
  }

  private updatePlayerMovement(delta: number): void {
    if (this.moveDirection === 0) return;

    const { width, height } = this.scale.gameSize;
    const dx = this.moveDirection * this.moveSpeed;
    this.playerX = Phaser.Math.Clamp(this.playerX + dx, 50, width - 50);
    this.playerSprite.x = this.playerX;
    this.shadowGraphics.setPosition(this.playerX, height * 0.6 + 35);

    // 歩行フレームアニメーション
    if (this.walkFrameKeys.length > 0) {
      this.walkFrameTimer += delta;
      if (this.walkFrameTimer >= this.walkFrameInterval) {
        this.walkFrameTimer -= this.walkFrameInterval;
        this.currentWalkFrame = (this.currentWalkFrame + 1) % this.walkFrameKeys.length;
        this.playerSprite.setTexture(this.walkFrameKeys[this.currentWalkFrame]);
      }
    }

    // 歩数カウント（一定距離ごと）
    this.stepAccumulator += Math.abs(dx);
    if (this.stepAccumulator >= 30) {
      this.stepAccumulator -= 30;
      this.stepCount++;

      // 砂埃パーティクル
      this.spawnDustParticle(this.playerX, height * 0.6 + 30);

      // ランダムエンカウント判定
      if (this.stepCount >= this.encounterThreshold) {
        this.stepCount = 0;
        this.encounterThreshold = 10 + Math.floor(Math.random() * 10);
        this.stopWalking();
        this.startRandomBattle();
      }
    }
  }

  update(_time: number, delta: number): void {
    this.updatePlayerMovement(delta);
  }

  private startRandomBattle(): void {
    audioGenerator.stopBGM();
    // エンカウント演出
    const { width, height } = this.scale.gameSize;
    const flash = this.add.graphics();
    flash.fillStyle(0xFFFFFF, 1);
    flash.fillRect(0, 0, width, height);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      repeat: 2,
      yoyo: true,
      onComplete: () => {
        this.scene.start(SCENES.BATTLE, { saveData: this.saveData, isBoss: false });
      },
    });
  }

  private startBossBattle(): void {
    audioGenerator.stopBGM();
    const chapter = this.saveData.currentChapter;
    const bossMap: Record<number, string[]> = {
      1: ['gares'],
      2: ['selene'],
      3: ['olga', 'boris'],
      4: ['xenon'],
      5: ['valthor'],
    };

    const bossIds = bossMap[chapter] ?? ['gares'];
    const enemies = bossIds.map(id => ({ ...BOSSES[id] }));

    // WARNING演出
    const { width, height } = this.scale.gameSize;
    const warning = this.add.text(width / 2, height * 0.4, 'WARNING', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: '64px',
      color: '#FF0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.cameras.main.shake(500, 0.02);

    this.tweens.add({
      targets: warning,
      alpha: 1,
      duration: 200,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        warning.destroy();
        this.scene.start(SCENES.BATTLE, { saveData: this.saveData, enemies, isBoss: true });
      },
    });
  }

  private showMessage(text: string, w: number, h: number): void {
    const msgBg = this.add.graphics();
    msgBg.fillStyle(0x0D1117, 0.9);
    msgBg.fillRoundedRect(w * 0.1, h * 0.45, w * 0.8, h * 0.1, 8);
    msgBg.lineStyle(1, 0x00E676, 0.5);
    msgBg.strokeRoundedRect(w * 0.1, h * 0.45, w * 0.8, h * 0.1, 8);

    const msgText = this.add.text(w / 2, h * 0.5, text, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(w * 0.035)}px`,
      color: '#FFFFFF',
    }).setOrigin(0.5);

    this.time.delayedCall(2000, () => {
      msgBg.destroy();
      msgText.destroy();
    });
  }
}
