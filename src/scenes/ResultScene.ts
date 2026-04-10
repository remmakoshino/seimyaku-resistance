import Phaser from 'phaser';
import { SCENES, GAME, COLORS } from '../utils/constants';
import { SaveData, SaveSystem } from '../systems/SaveSystem';
import { LEVEL_UP_STATS } from '../characters/CharacterData';
import { audioGenerator } from '../utils/AudioGenerator';

export class ResultScene extends Phaser.Scene {
  private saveData!: SaveData;
  private rewards!: { exp: number; money: number; smp: number; items: string[] };
  private isBoss = false;

  constructor() {
    super({ key: SCENES.RESULT });
  }

  init(data: { saveData: SaveData; rewards: { exp: number; money: number; smp: number; items: string[] }; isBoss: boolean }): void {
    this.saveData = data.saveData;
    this.rewards = data.rewards;
    this.isBoss = data.isBoss;
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    this.cameras.main.setBackgroundColor(COLORS.BG);

    // タイトル
    this.add.text(width / 2, height * 0.06, '戦闘勝利！', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(width * 0.07)}px`,
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 報酬表示
    const rewardY = height * 0.15;
    const fontSize = Math.floor(width * 0.035);

    this.add.text(width / 2, rewardY, `経験値: ${this.rewards.exp}`, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${fontSize}px`,
      color: '#00E676',
    }).setOrigin(0.5);

    this.add.text(width / 2, rewardY + height * 0.04, `クレジット: ${this.rewards.money}`, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${fontSize}px`,
      color: '#FFC107',
    }).setOrigin(0.5);

    this.add.text(width / 2, rewardY + height * 0.08, `星脈ポイント: ${this.rewards.smp}`, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${fontSize}px`,
      color: '#00BCD4',
    }).setOrigin(0.5);

    if (this.rewards.items.length > 0) {
      this.add.text(width / 2, rewardY + height * 0.12, `入手アイテム: ${this.rewards.items.join(', ')}`, {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${fontSize}px`,
        color: '#C0C0D0',
      }).setOrigin(0.5);
    }

    // 経験値を適用してレベルアップ判定
    this.saveData.money += this.rewards.money;
    let levelUpInfo: string[] = [];

    for (const charId of this.saveData.party) {
      const char = this.saveData.characters.find(c => c.id === charId);
      if (!char) continue;
      char.exp += this.rewards.exp;

      // レベルアップ判定
      const required = GAME.BASE_EXP_REQUIRED * Math.pow(GAME.EXP_GROWTH_RATE, char.level - 1);
      while (char.exp >= required && char.level < GAME.MAX_LEVEL) {
        char.exp -= Math.floor(required);
        char.level++;
        const growth = LEVEL_UP_STATS[char.id];
        if (growth) {
          char.maxHp += growth.hp;
          char.hp = char.maxHp;
          char.maxSp += growth.sp;
          char.sp = char.maxSp;
          char.attack += growth.attack ?? 0;
          char.defense += growth.defense ?? 0;
          char.magicAttack += growth.magicAttack ?? 0;
          char.magicDefense += growth.magicDefense ?? 0;
          char.agility += growth.agility ?? 0;
        }
        levelUpInfo.push(`${char.name} → Lv.${char.level}`);
      }
    }

    // レベルアップ表示
    if (levelUpInfo.length > 0) {
      const lvUpY = height * 0.35;
      this.add.text(width / 2, lvUpY, 'レベルアップ！', {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${Math.floor(width * 0.05)}px`,
        color: '#FFD700',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      levelUpInfo.forEach((info, i) => {
        this.add.text(width / 2, lvUpY + height * 0.05 + i * height * 0.04, info, {
          fontFamily: GAME.FONT_FAMILY,
          fontSize: `${fontSize}px`,
          color: '#FFFFFF',
        }).setOrigin(0.5);
      });
    }

    // ボスクリアの場合
    if (this.isBoss) {
      if (!this.saveData.clearedChapters.includes(this.saveData.currentChapter)) {
        this.saveData.clearedChapters.push(this.saveData.currentChapter);
      }
    }

    SaveSystem.save(this.saveData);

    // 次へボタン
    const btnY = height * 0.85;
    const btnLabel = this.isBoss ? '次のチャプターへ' : '探索に戻る';
    const btn = this.add.text(width / 2, btnY, btnLabel, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(width * 0.04)}px`,
      color: '#00E676',
      fontStyle: 'bold',
      backgroundColor: '#1B2838',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive();

    btn.on('pointerdown', () => {
      audioGenerator.playConfirmSE();
      if (this.isBoss && this.saveData.currentChapter < 5) {
        this.saveData.currentChapter++;
        SaveSystem.save(this.saveData);
        this.scene.start(SCENES.STORY, { chapter: this.saveData.currentChapter, saveData: this.saveData });
      } else if (this.isBoss && this.saveData.currentChapter >= 5) {
        // エンディング
        this.scene.start(SCENES.STORY, { chapter: 6, saveData: this.saveData, isEnding: true });
      } else {
        this.scene.start(SCENES.EXPLORATION, { saveData: this.saveData });
      }
    });
  }
}
