import Phaser from 'phaser';
import { SCENES, GAME, COLORS } from '../utils/constants';
import { INITIAL_CHARACTERS } from '../characters/CharacterData';
import { SaveSystem, SaveData } from '../systems/SaveSystem';
import { audioGenerator } from '../utils/AudioGenerator';

export class CharacterSelectScene extends Phaser.Scene {
  private saveData!: SaveData;
  private selectedParty: string[] = [];
  private selectionIndicators: Map<string, Phaser.GameObjects.Graphics> = new Map();

  constructor() {
    super({ key: SCENES.CHARACTER_SELECT });
  }

  init(data: { saveData: SaveData }): void {
    this.saveData = data.saveData;
    this.selectedParty = [...this.saveData.party];
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    this.cameras.main.setBackgroundColor(COLORS.BG);

    // タイトル
    this.add.text(width / 2, height * 0.05, 'パーティ編成', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(width * 0.06)}px`,
      color: '#00E676',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.1, '3人を選択してください', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(width * 0.03)}px`,
      color: '#C0C0D0',
    }).setOrigin(0.5);

    // キャラクターカード
    const chars = this.saveData.characters.length > 0 ? this.saveData.characters : INITIAL_CHARACTERS;
    const cardW = width * 0.85;
    const cardH = height * 0.12;
    const startY = height * 0.16;
    const gap = height * 0.135;

    chars.forEach((char, i) => {
      const y = startY + i * gap;
      this.createCharacterCard(width / 2, y, cardW, cardH, char.id, char.name, char.level,
        char.hp, char.maxHp, char.sp, char.maxSp, char.weaponType, char.colorHex);
    });

    // 出撃ボタン
    const sortieBtn = this.add.graphics();
    const btnY = height * 0.88;
    const btnW = width * 0.5;
    const btnH = height * 0.06;
    sortieBtn.fillStyle(0x003322, 0.9);
    sortieBtn.fillRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);
    sortieBtn.lineStyle(2, 0x00E676, 1);
    sortieBtn.strokeRoundedRect(width / 2 - btnW / 2, btnY - btnH / 2, btnW, btnH, 8);

    this.add.text(width / 2, btnY, '出撃！', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(btnH * 0.5)}px`,
      color: '#00E676',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const sortieHit = this.add.rectangle(width / 2, btnY, btnW, btnH).setInteractive().setAlpha(0.001);
    sortieHit.on('pointerdown', () => {
      if (this.selectedParty.length !== 3) return;
      audioGenerator.playConfirmSE();
      this.saveData.party = [...this.selectedParty];
      SaveSystem.save(this.saveData);
      this.scene.start(SCENES.EXPLORATION, { saveData: this.saveData });
    });
  }

  private createCharacterCard(
    x: number, y: number, w: number, h: number,
    id: string, name: string, level: number,
    hp: number, maxHp: number, sp: number, maxSp: number,
    weaponType: string, colorHex: string,
  ): void {
    const isSelected = this.selectedParty.includes(id);

    // 選択インジケータ
    const indicator = this.add.graphics();
    this.selectionIndicators.set(id, indicator);
    this.drawCardBg(indicator, x, y, w, h, colorHex, isSelected);

    // キャラアイコン
    const iconKey = `char_${id}`;
    if (this.textures.exists(iconKey)) {
      this.add.image(x - w / 2 + h * 0.6, y, iconKey).setDisplaySize(h * 0.7, h * 0.9);
    }

    // 名前
    const fontSize = Math.floor(h * 0.25);
    this.add.text(x - w / 2 + h * 1.2, y - h * 0.3, name, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${fontSize}px`,
      color: '#FFFFFF',
      fontStyle: 'bold',
    });

    // レベル
    this.add.text(x + w / 2 - 10, y - h * 0.3, `Lv.${level}`, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(fontSize * 0.8)}px`,
      color: '#C0C0D0',
    }).setOrigin(1, 0);

    // HP/SP
    const infoFontSize = Math.floor(fontSize * 0.7);
    this.add.text(x - w / 2 + h * 1.2, y, `HP: ${hp}/${maxHp}  SP: ${sp}/${maxSp}`, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${infoFontSize}px`,
      color: '#AAAACC',
    });

    // 武器タイプ
    this.add.text(x - w / 2 + h * 1.2, y + h * 0.25, `武器: ${weaponType}`, {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${infoFontSize}px`,
      color: '#888899',
    });

    // タップ判定
    const hitArea = this.add.rectangle(x, y, w, h).setInteractive().setAlpha(0.001);
    hitArea.on('pointerdown', () => {
      audioGenerator.playCursorSE();
      const idx = this.selectedParty.indexOf(id);
      if (idx >= 0) {
        this.selectedParty.splice(idx, 1);
      } else if (this.selectedParty.length < 3) {
        this.selectedParty.push(id);
      }
      // 全カードの選択状態更新
      for (const [cid, ind] of this.selectionIndicators) {
        ind.clear();
        const charData = (this.saveData.characters.length > 0 ? this.saveData.characters : INITIAL_CHARACTERS).find(c => c.id === cid);
        if (charData) {
          this.drawCardBg(ind, x, y, w, h, charData.colorHex, this.selectedParty.includes(cid));
        }
      }
    });
  }

  private drawCardBg(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, colorHex: string, selected: boolean): void {
    g.clear();
    if (selected) {
      g.fillStyle(0x1B2838, 0.95);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      const color = parseInt(colorHex.replace('#', ''), 16);
      g.lineStyle(3, color, 1);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    } else {
      g.fillStyle(0x0D1117, 0.7);
      g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      g.lineStyle(1, 0x333355, 0.5);
      g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    }
  }
}
