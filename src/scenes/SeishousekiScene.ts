import Phaser from 'phaser';
import { SCENES, GAME, COLORS } from '../utils/constants';
import { SaveData, SaveSystem } from '../systems/SaveSystem';
import { Seishouseki, Character } from '../characters/CharacterData';
import { audioGenerator } from '../utils/AudioGenerator';
import { SEISHOUSEKI_TEMPLATES, createSeishouseki } from '../systems/SeishousekiSystem';

export class SeishousekiScene extends Phaser.Scene {
  private saveData!: SaveData;
  private selectedCharIndex = 0;
  private selectedSlotIndex = -1;
  private uiContainer!: Phaser.GameObjects.Container;
  private inventoryContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: SCENES.SEISHOUSEKI });
  }

  init(data: { saveData: SaveData }): void {
    this.saveData = data.saveData;
    this.selectedCharIndex = 0;
    this.selectedSlotIndex = -1;
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    this.cameras.main.setBackgroundColor(COLORS.BG);

    this.uiContainer = this.add.container(0, 0);
    this.inventoryContainer = this.add.container(0, 0);

    // タイトル
    this.add.text(width / 2, height * 0.03, '星晶石管理', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(width * 0.06)}px`,
      color: '#00BCD4',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 戻るボタン
    const backBtn = this.add.text(20, height * 0.03, '← 戻る', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${Math.floor(width * 0.035)}px`,
      color: '#AAAACC',
    }).setInteractive();
    backBtn.on('pointerdown', () => {
      audioGenerator.playCursorSE();
      SaveSystem.save(this.saveData);
      this.scene.start(SCENES.EXPLORATION, { saveData: this.saveData });
    });

    this.drawCharacterTabs(width, height);
    this.drawCharacterSlots(width, height);
    this.drawInventory(width, height);
  }

  private drawCharacterTabs(w: number, h: number): void {
    const partyChars = this.saveData.party.map(id => this.saveData.characters.find(c => c.id === id)!).filter(Boolean);
    const tabY = h * 0.08;
    const tabW = w / partyChars.length;

    partyChars.forEach((char, i) => {
      const x = tabW * i + tabW / 2;
      const isActive = i === this.selectedCharIndex;

      const bg = this.add.graphics();
      bg.fillStyle(isActive ? 0x1B3838 : 0x0D1117, 0.9);
      bg.fillRoundedRect(tabW * i + 5, tabY, tabW - 10, h * 0.06, 4);
      if (isActive) {
        bg.lineStyle(2, 0x00BCD4, 1);
        bg.strokeRoundedRect(tabW * i + 5, tabY, tabW - 10, h * 0.06, 4);
      }

      const nameText = this.add.text(x, tabY + h * 0.03, char.name.split('・')[0], {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${Math.floor(w * 0.03)}px`,
        color: isActive ? '#00BCD4' : '#888888',
        fontStyle: isActive ? 'bold' : 'normal',
      }).setOrigin(0.5);

      const hit = this.add.rectangle(x, tabY + h * 0.03, tabW - 10, h * 0.06).setInteractive().setAlpha(0.001);
      hit.on('pointerdown', () => {
        audioGenerator.playCursorSE();
        this.selectedCharIndex = i;
        this.selectedSlotIndex = -1;
        this.scene.restart({ saveData: this.saveData });
      });
    });
  }

  private drawCharacterSlots(w: number, h: number): void {
    this.uiContainer.removeAll(true);
    const partyChars = this.saveData.party.map(id => this.saveData.characters.find(c => c.id === id)!).filter(Boolean);
    const char = partyChars[this.selectedCharIndex];
    if (!char) return;

    const slotsY = h * 0.16;
    const margin = w * 0.05;
    const fontSize = Math.floor(w * 0.03);

    // 装備名表示
    const equips = [
      { label: '武器', name: char.weapon.name, slots: char.weapon.slots },
      { label: '防具', name: char.armor.name, slots: char.armor.slots },
      { label: '装飾', name: char.accessory.name, slots: char.accessory.slots },
    ];

    let yPos = slotsY;
    equips.forEach((eq) => {
      const label = this.add.text(margin, yPos, `${eq.label}: ${eq.name}`, {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${fontSize}px`,
        color: '#C0C0D0',
      });
      this.uiContainer.add(label);
      yPos += fontSize + 8;
    });

    // 装備中の星晶石スロット表示
    yPos += 10;
    const slotLabel = this.add.text(margin, yPos, '装備中の星晶石:', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${fontSize}px`,
      color: '#00BCD4',
      fontStyle: 'bold',
    });
    this.uiContainer.add(slotLabel);
    yPos += fontSize + 10;

    const totalSlots = char.weapon.slots + char.armor.slots + char.accessory.slots;
    const slotSize = Math.min(40, (w - margin * 2) / Math.max(totalSlots, 1) - 8);

    for (let i = 0; i < char.seishouseki.length && i < totalSlots; i++) {
      const seki = char.seishouseki[i];
      const x = margin + i * (slotSize + 8);
      const isSelected = this.selectedSlotIndex === i;

      const slotBg = this.add.graphics();
      const colorNum = parseInt(seki.color.replace('#', ''), 16);
      slotBg.fillStyle(colorNum, 0.5);
      slotBg.fillRoundedRect(x, yPos, slotSize, slotSize, 4);
      if (isSelected) {
        slotBg.lineStyle(2, 0xFFD700, 1);
        slotBg.strokeRoundedRect(x, yPos, slotSize, slotSize, 4);
      }
      this.uiContainer.add(slotBg);

      // レベル表示
      const lvText = this.add.text(x + slotSize / 2, yPos + slotSize / 2, `${seki.level}`, {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${Math.floor(slotSize * 0.4)}px`,
        color: '#FFFFFF',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.uiContainer.add(lvText);

      const hit = this.add.rectangle(x + slotSize / 2, yPos + slotSize / 2, slotSize, slotSize).setInteractive().setAlpha(0.001);
      this.uiContainer.add(hit);
      hit.on('pointerdown', () => {
        audioGenerator.playCursorSE();
        // 外す
        char.seishouseki.splice(i, 1);
        this.scene.restart({ saveData: this.saveData });
      });
    }

    // 空きスロット
    for (let i = char.seishouseki.length; i < totalSlots; i++) {
      const x = margin + i * (slotSize + 8);
      const emptySlot = this.add.graphics();
      emptySlot.lineStyle(1, 0x555555, 0.8);
      emptySlot.strokeRoundedRect(x, yPos, slotSize, slotSize, 4);
      this.uiContainer.add(emptySlot);

      const plusText = this.add.text(x + slotSize / 2, yPos + slotSize / 2, '+', {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${Math.floor(slotSize * 0.5)}px`,
        color: '#555555',
      }).setOrigin(0.5);
      this.uiContainer.add(plusText);

      const hit = this.add.rectangle(x + slotSize / 2, yPos + slotSize / 2, slotSize, slotSize).setInteractive().setAlpha(0.001);
      this.uiContainer.add(hit);
      hit.on('pointerdown', () => {
        audioGenerator.playCursorSE();
        this.selectedSlotIndex = i;
        this.drawInventory(w, h);
      });
    }

    // 星晶石の詳細表示
    yPos += slotSize + 15;
    if (char.seishouseki.length > 0) {
      const detailLabel = this.add.text(margin, yPos, '習得スキル:', {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${fontSize - 2}px`,
        color: '#AAAACC',
      });
      this.uiContainer.add(detailLabel);
      yPos += fontSize + 4;

      const allSkillNames = new Set<string>();
      for (const seki of char.seishouseki) {
        for (const skill of seki.skills) {
          allSkillNames.add(`${skill.name} (${skill.element === 'none' ? '無' : skill.element})`);
        }
      }

      Array.from(allSkillNames).forEach((skillInfo, i) => {
        const skillText = this.add.text(margin + 10, yPos + i * (fontSize + 2), `・${skillInfo}`, {
          fontFamily: GAME.FONT_FAMILY,
          fontSize: `${fontSize - 2}px`,
          color: '#88CCAA',
        });
        this.uiContainer.add(skillText);
      });
    }
  }

  private drawInventory(w: number, h: number): void {
    this.inventoryContainer.removeAll(true);

    const invY = h * 0.55;
    const margin = w * 0.05;
    const fontSize = Math.floor(w * 0.03);

    // インベントリ背景
    const bg = this.add.graphics();
    bg.fillStyle(0x0D1117, 0.85);
    bg.fillRoundedRect(margin, invY, w - margin * 2, h * 0.4, 8);
    bg.lineStyle(1, 0x00BCD4, 0.3);
    bg.strokeRoundedRect(margin, invY, w - margin * 2, h * 0.4, 8);
    this.inventoryContainer.add(bg);

    const titleText = this.add.text(margin + 15, invY + 10, '所持星晶石', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: `${fontSize}px`,
      color: '#00BCD4',
      fontStyle: 'bold',
    });
    this.inventoryContainer.add(titleText);

    // インベントリの星晶石
    const seishousekiItems = this.saveData.inventory.filter(item => item.type === 'seishouseki');

    if (seishousekiItems.length === 0) {
      const noItem = this.add.text(w / 2, invY + h * 0.15, '星晶石を所持していません', {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${fontSize}px`,
        color: '#666666',
      }).setOrigin(0.5);
      this.inventoryContainer.add(noItem);
      return;
    }

    const itemY = invY + 35;
    const itemH = 35;

    seishousekiItems.forEach((item, i) => {
      const y = itemY + i * itemH;
      if (y > invY + h * 0.35) return;

      const template = SEISHOUSEKI_TEMPLATES.find(t => t.name === item.name);
      const color = template?.color ?? '#888888';

      // 色ドット
      const dot = this.add.graphics();
      dot.fillStyle(parseInt(color.replace('#', ''), 16), 1);
      dot.fillCircle(margin + 25, y + 10, 6);
      this.inventoryContainer.add(dot);

      const text = this.add.text(margin + 40, y, `${item.name} x${item.quantity}`, {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${fontSize}px`,
        color: '#FFFFFF',
      });
      this.inventoryContainer.add(text);

      const hit = this.add.rectangle(w / 2, y + 10, w - margin * 2, itemH).setInteractive().setAlpha(0.001);
      this.inventoryContainer.add(hit);

      hit.on('pointerdown', () => {
        audioGenerator.playConfirmSE();
        this.equipSeishouseki(item.id, item.name);
      });
    });
  }

  private equipSeishouseki(itemId: string, itemName: string): void {
    const partyChars = this.saveData.party.map(id => this.saveData.characters.find(c => c.id === id)!).filter(Boolean);
    const char = partyChars[this.selectedCharIndex];
    if (!char) return;

    const totalSlots = char.weapon.slots + char.armor.slots + char.accessory.slots;
    if (char.seishouseki.length >= totalSlots) return;

    // インベントリから削除
    const invItem = this.saveData.inventory.find(i => i.id === itemId && i.type === 'seishouseki');
    if (!invItem || invItem.quantity <= 0) return;
    invItem.quantity--;
    if (invItem.quantity <= 0) {
      this.saveData.inventory = this.saveData.inventory.filter(i => i !== invItem);
    }

    // 星晶石を生成して装備
    const template = SEISHOUSEKI_TEMPLATES.find(t => t.name === itemName);
    if (template) {
      const seki = createSeishouseki(template.id);
      if (seki) {
        char.seishouseki.push(seki);
      }
    }

    SaveSystem.save(this.saveData);
    this.scene.restart({ saveData: this.saveData });
  }
}
