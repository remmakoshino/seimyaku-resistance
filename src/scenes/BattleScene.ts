import Phaser from 'phaser';
import { SCENES, GAME, COLORS } from '../utils/constants';
import { Character, INITIAL_CHARACTERS } from '../characters/CharacterData';
import { Enemy, ENEMIES, BOSSES, ENCOUNTER_TABLES } from '../characters/EnemyData';
import { BattleSystem, BattleAction, BattleEvent } from '../battle/BattleSystem';
import { ATBUnit } from '../battle/ATBManager';
import { ATTACK_SKILLS, RECOVERY_SKILLS, SUPPORT_SKILLS } from '../battle/SkillSystem';
import { Skill } from '../characters/CharacterData';
import { audioGenerator } from '../utils/AudioGenerator';
import { SaveData } from '../systems/SaveSystem';

type CommandPhase = 'waiting' | 'command' | 'skill_select' | 'target_select' | 'item_select' | 'animating';

export class BattleScene extends Phaser.Scene {
  private battleSystem!: BattleSystem;
  private saveData!: SaveData;
  private allies: Character[] = [];
  private enemies: Enemy[] = [];
  private phase: CommandPhase = 'waiting';
  private activeAllyId = '';
  private selectedCommand: string | null = null;
  private selectedSkill: Skill | null = null;
  private uiContainer!: Phaser.GameObjects.Container;
  private commandContainer!: Phaser.GameObjects.Container;
  private statusContainer!: Phaser.GameObjects.Container;
  private eventQueue: BattleEvent[] = [];
  private isProcessingEvents = false;
  private allySprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private enemySprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private damageTexts: Phaser.GameObjects.Text[] = [];
  private isBoss = false;

  constructor() {
    super({ key: SCENES.BATTLE });
  }

  init(data: { saveData: SaveData; enemies?: Enemy[]; isBoss?: boolean }): void {
    this.saveData = data.saveData;
    this.isBoss = data.isBoss ?? false;

    // パーティメンバー準備
    const chars = this.saveData.characters.length > 0 ? this.saveData.characters : INITIAL_CHARACTERS;
    this.allies = this.saveData.party.map(id => {
      const c = chars.find(ch => ch.id === id);
      return c ? { ...c } : { ...INITIAL_CHARACTERS[0] };
    });

    // 敵準備
    if (data.enemies) {
      this.enemies = data.enemies.map(e => ({ ...e }));
    } else {
      const chapter = this.saveData.currentChapter;
      const table = ENCOUNTER_TABLES[chapter] ?? ENCOUNTER_TABLES[1];
      const count = Math.floor(Math.random() * 2) + 1;
      this.enemies = [];
      for (let i = 0; i < count; i++) {
        const enemyId = table[Math.floor(Math.random() * table.length)];
        const enemy = ENEMIES[enemyId];
        if (enemy) {
          this.enemies.push({ ...enemy, id: `${enemy.id}_${i}` });
        }
      }
    }

    this.phase = 'waiting';
    this.activeAllyId = '';
    this.selectedCommand = null;
    this.selectedSkill = null;
    this.eventQueue = [];
    this.isProcessingEvents = false;
  }

  create(): void {
    const { width, height } = this.scale.gameSize;
    this.cameras.main.setBackgroundColor(COLORS.BG);

    // バトルBGM
    if (this.isBoss) {
      audioGenerator.playBossBGM();
    } else {
      audioGenerator.playBattleBGM();
    }

    // バトルシステム初期化
    this.battleSystem = new BattleSystem(this.allies, this.enemies);

    // 背景描画
    this.drawBattleBackground(width, height);

    // UIコンテナ
    this.uiContainer = this.add.container(0, 0);
    this.commandContainer = this.add.container(0, 0);
    this.statusContainer = this.add.container(0, 0);

    // 敵スプライト配置
    this.layoutEnemies(width, height);

    // 味方スプライト配置
    this.layoutAllies(width, height);

    // ステータスUI描画
    this.drawStatusUI(width, height);

    // エンカウント演出
    this.playEncounterEffect(width, height);
  }

  private drawBattleBackground(w: number, h: number): void {
    const bg = this.add.graphics();
    // グラデーション背景
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const r = Math.floor(13 + t * 15);
      const g = Math.floor(17 + t * 10);
      const b = Math.floor(23 + t * 20);
      bg.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
      bg.fillRect(0, y, w, 1);
    }

    // 地面ライン
    const groundY = h * 0.55;
    bg.lineStyle(1, 0x333355, 0.5);
    bg.lineBetween(0, groundY, w, groundY);

    // 星脈のグリッドパターン
    bg.lineStyle(1, 0x00E676, 0.05);
    for (let x = 0; x < w; x += 40) {
      bg.lineBetween(x, groundY, x + (w / 2 - x) * 0.3, h);
    }
    for (let y = groundY; y < h; y += 30) {
      bg.lineBetween(0, y, w, y);
    }
  }

  private layoutEnemies(w: number, h: number): void {
    const enemyAreaY = h * 0.15;
    const spacing = w / (this.enemies.length + 1);

    this.enemies.forEach((enemy, i) => {
      const x = spacing * (i + 1);
      const y = enemyAreaY + (enemy.isBoss ? 0 : h * 0.05);
      const size = enemy.isBoss ? 1.2 : 0.8;

      const textureKey = `enemy_${enemy.id.replace(/_\d+$/, '')}`;
      if (this.textures.exists(textureKey)) {
        const sprite = this.add.image(x, y, textureKey).setScale(size);
        this.enemySprites.set(enemy.id, sprite);
      } else {
        // テクスチャがない場合はプレースホルダー
        const g = this.add.graphics();
        g.fillStyle(0xFF4444, 0.5);
        g.fillCircle(x, y, 30 * size);
        const ph = this.add.image(x, y, '__DEFAULT').setScale(0.001);
        this.enemySprites.set(enemy.id, ph);
      }

      // 敵名
      this.add.text(x, y + 60 * size, enemy.name, {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: '14px',
        color: '#FFFFFF',
      }).setOrigin(0.5);

      // HPバー
      this.drawEnemyHPBar(x, y + 75 * size, enemy, w * 0.12);
    });
  }

  private drawEnemyHPBar(x: number, y: number, enemy: Enemy, barW: number): void {
    const tag = `ehp_${enemy.id}`;
    // 既存削除
    const existing = this.uiContainer.getByName(tag);
    if (existing) existing.destroy();

    const g = this.add.graphics();
    g.setName(tag);
    g.fillStyle(0x333333, 0.8);
    g.fillRect(x - barW / 2, y, barW, 6);
    const ratio = Math.max(0, enemy.hp / enemy.maxHp);
    const color = ratio > 0.5 ? 0xFF4444 : ratio > 0.2 ? 0xFF8800 : 0xFF1744;
    g.fillStyle(color, 1);
    g.fillRect(x - barW / 2, y, barW * ratio, 6);
    this.uiContainer.add(g);
  }

  private layoutAllies(w: number, h: number): void {
    const allyAreaY = h * 0.45;
    const spacing = w / (this.allies.length + 1);

    this.allies.forEach((ally, i) => {
      const x = spacing * (i + 1);
      const textureKey = `char_${ally.id}`;
      if (this.textures.exists(textureKey)) {
        const sprite = this.add.image(x, allyAreaY, textureKey).setScale(0.7);
        this.allySprites.set(ally.id, sprite);
      }
    });
  }

  private drawStatusUI(w: number, h: number): void {
    this.statusContainer.removeAll(true);

    const statusY = h * 0.58;
    const statusH = h * 0.2;
    const margin = w * GAME.SAFE_MARGIN;

    // ステータス背景
    const bg = this.add.graphics();
    bg.fillStyle(0x0D1117, 0.85);
    bg.fillRoundedRect(margin, statusY, w - margin * 2, statusH, 8);
    bg.lineStyle(1, 0x00E676, 0.3);
    bg.strokeRoundedRect(margin, statusY, w - margin * 2, statusH, 8);
    this.statusContainer.add(bg);

    const state = this.battleSystem.getState();
    const rowH = statusH / this.allies.length;

    state.allies.forEach((ally, i) => {
      const y = statusY + rowH * i + rowH * 0.15;
      const isActive = ally.id === this.activeAllyId;
      const fontSize = Math.floor(Math.min(w * 0.03, 16));

      // アクティブインジケーター
      if (isActive) {
        const indicator = this.add.text(margin + 10, y + rowH * 0.2, '▶', {
          fontFamily: GAME.FONT_FAMILY,
          fontSize: `${fontSize}px`,
          color: '#00E676',
        });
        this.statusContainer.add(indicator);
      }

      // 名前
      const nameText = this.add.text(margin + 30, y, ally.name, {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${fontSize}px`,
        color: ally.hp > 0 ? '#FFFFFF' : '#666666',
        fontStyle: isActive ? 'bold' : 'normal',
      });
      this.statusContainer.add(nameText);

      // HP
      const hpX = margin + w * 0.3;
      const hpColor = ally.hp / ally.maxHp > 0.25 ? '#FFFFFF' : '#FF1744';
      const hpText = this.add.text(hpX, y, `HP:${ally.hp}/${ally.maxHp}`, {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${fontSize - 2}px`,
        color: hpColor,
      });
      this.statusContainer.add(hpText);

      // SP
      const spText = this.add.text(hpX, y + fontSize + 2, `SP:${ally.sp}/${ally.maxSp}`, {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${fontSize - 2}px`,
        color: '#00BCD4',
      });
      this.statusContainer.add(spText);

      // ATBゲージ
      const atbUnit = this.battleSystem.getATBManager().getUnit(ally.id);
      const atbX = w - margin - w * 0.3;
      const atbBarW = w * 0.25;
      const atbY = y + 4;

      const atbBg = this.add.graphics();
      atbBg.fillStyle(0x333333, 0.8);
      atbBg.fillRect(atbX, atbY, atbBarW, 10);
      this.statusContainer.add(atbBg);

      if (atbUnit) {
        const atbFill = this.add.graphics();
        const atbRatio = atbUnit.atbGauge / GAME.ATB_MAX;
        atbFill.fillStyle(atbUnit.isReady ? 0x00E676 : 0xFFC107, 1);
        atbFill.fillRect(atbX, atbY, atbBarW * atbRatio, 10);
        this.statusContainer.add(atbFill);

        if (atbUnit.isReady) {
          const readyText = this.add.text(atbX + atbBarW + 5, atbY - 2, 'READY', {
            fontFamily: GAME.FONT_FAMILY,
            fontSize: `${fontSize - 4}px`,
            color: '#00E676',
            fontStyle: 'bold',
          });
          this.statusContainer.add(readyText);
        }
      }

      // 覚醒ゲージ
      const awkX = atbX;
      const awkY = atbY + 14;
      const awkBarW = atbBarW;
      const awkBg = this.add.graphics();
      awkBg.fillStyle(0x333333, 0.5);
      awkBg.fillRect(awkX, awkY, awkBarW, 6);
      this.statusContainer.add(awkBg);

      const awkRatio = ally.awakenGauge / ally.maxAwakenGauge;
      const awkFill = this.add.graphics();
      awkFill.fillStyle(awkRatio >= 1 ? 0xFFD700 : 0x886600, 1);
      awkFill.fillRect(awkX, awkY, awkBarW * awkRatio, 6);
      this.statusContainer.add(awkFill);
    });
  }

  private showCommandMenu(w: number, h: number): void {
    this.commandContainer.removeAll(true);
    this.phase = 'command';

    const cmdY = h * 0.8;
    const cmdH = h * 0.18;
    const margin = w * GAME.SAFE_MARGIN;

    // コマンド背景
    const bg = this.add.graphics();
    bg.fillStyle(0x0D1117, 0.85);
    bg.fillRoundedRect(margin, cmdY, w - margin * 2, cmdH, 8);
    bg.lineStyle(2, 0x00E676, 0.7);
    bg.strokeRoundedRect(margin, cmdY, w - margin * 2, cmdH, 8);
    this.commandContainer.add(bg);

    // コマンドボタン
    const commands = [
      { label: 'たたかう', action: 'attack' },
      { label: '星術', action: 'skill' },
      { label: '星晶技', action: 'seishouseki_skill' },
      { label: 'アイテム', action: 'item' },
      { label: '覚醒', action: 'awaken' },
      { label: '防御', action: 'defend' },
    ];

    const cols = 2;
    const rows = 3;
    const btnW = (w - margin * 2 - 30) / cols;
    const btnH = (cmdH - 20) / rows;
    const ally = this.battleSystem.getState().allies.find(a => a.id === this.activeAllyId);

    commands.forEach((cmd, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = margin + 10 + col * btnW + btnW / 2;
      const by = cmdY + 10 + row * btnH + btnH / 2;

      const isAwaken = cmd.action === 'awaken';
      const canAwaken = ally && ally.awakenGauge >= ally.maxAwakenGauge;
      const disabled = isAwaken && !canAwaken;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(disabled ? 0x222233 : 0x1B2838, 0.9);
      btnBg.fillRoundedRect(bx - btnW / 2 + 2, by - btnH / 2 + 2, btnW - 4, btnH - 4, 4);
      btnBg.lineStyle(1, disabled ? 0x333355 : 0x00E676, disabled ? 0.3 : 0.6);
      btnBg.strokeRoundedRect(bx - btnW / 2 + 2, by - btnH / 2 + 2, btnW - 4, btnH - 4, 4);
      this.commandContainer.add(btnBg);

      const btnText = this.add.text(bx, by, cmd.label, {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: `${Math.floor(btnH * 0.35)}px`,
        color: disabled ? '#555555' : '#FFFFFF',
      }).setOrigin(0.5);
      this.commandContainer.add(btnText);

      if (!disabled) {
        const hit = this.add.rectangle(bx, by, btnW - 4, btnH - 4).setInteractive().setAlpha(0.001);
        this.commandContainer.add(hit);
        hit.on('pointerdown', () => {
          audioGenerator.playCursorSE();
          this.handleCommand(cmd.action, w, h);
        });
      }
    });
  }

  private handleCommand(action: string, w: number, h: number): void {
    switch (action) {
      case 'attack':
        this.selectedCommand = 'attack';
        this.showTargetSelect(w, h, 'enemy');
        break;
      case 'skill':
        this.showSkillSelect(w, h);
        break;
      case 'seishouseki_skill':
        // 星晶技は後で実装。通常攻撃に戻す
        this.selectedCommand = 'attack';
        this.showTargetSelect(w, h, 'enemy');
        break;
      case 'item':
        this.showItemSelect(w, h);
        break;
      case 'awaken':
        this.selectedCommand = 'awaken';
        this.executeAction({ type: 'awaken' });
        break;
      case 'defend':
        this.selectedCommand = 'defend';
        this.executeAction({ type: 'defend' });
        break;
    }
  }

  private showSkillSelect(w: number, h: number): void {
    this.commandContainer.removeAll(true);
    this.phase = 'skill_select';

    const cmdY = h * 0.72;
    const cmdH = h * 0.26;
    const margin = w * GAME.SAFE_MARGIN;

    const bg = this.add.graphics();
    bg.fillStyle(0x0D1117, 0.9);
    bg.fillRoundedRect(margin, cmdY, w - margin * 2, cmdH, 8);
    bg.lineStyle(2, 0x00E676, 0.7);
    bg.strokeRoundedRect(margin, cmdY, w - margin * 2, cmdH, 8);
    this.commandContainer.add(bg);

    // 戻るボタン
    const backText = this.add.text(margin + 15, cmdY + 8, '← 戻る', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: '14px',
      color: '#AAAACC',
    }).setInteractive();
    backText.on('pointerdown', () => {
      this.showCommandMenu(w, h);
    });
    this.commandContainer.add(backText);

    // スキルリスト
    const allSkills = [...ATTACK_SKILLS, ...RECOVERY_SKILLS, ...SUPPORT_SKILLS];
    const ally = this.battleSystem.getState().allies.find(a => a.id === this.activeAllyId);
    const skillY = cmdY + 30;
    const skillH = 30;

    allSkills.slice(0, Math.floor((cmdH - 40) / skillH)).forEach((skill, i) => {
      const y = skillY + i * skillH;
      const canUse = ally && ally.sp >= skill.spCost;

      const text = this.add.text(margin + 15, y, `${skill.name} (SP:${skill.spCost})`, {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: '14px',
        color: canUse ? '#FFFFFF' : '#555555',
      });
      this.commandContainer.add(text);

      // 属性アイコン色
      const elemColor = this.getElementColor(skill.element);
      const dot = this.add.graphics();
      dot.fillStyle(elemColor, canUse ? 1 : 0.3);
      dot.fillCircle(w - margin - 20, y + 8, 5);
      this.commandContainer.add(dot);

      if (canUse) {
        const hit = this.add.rectangle(w / 2, y + 8, w - margin * 2, skillH).setInteractive().setAlpha(0.001);
        this.commandContainer.add(hit);
        hit.on('pointerdown', () => {
          audioGenerator.playCursorSE();
          this.selectedSkill = skill;
          if (skill.type === 'attack') {
            this.showTargetSelect(w, h, skill.target === 'all' ? 'all_enemy' : 'enemy');
          } else if (skill.type === 'recovery') {
            if (skill.name === 'リヴァイブ') {
              this.showTargetSelect(w, h, 'dead_ally');
            } else {
              this.showTargetSelect(w, h, skill.target === 'all' ? 'all_ally' : 'ally');
            }
          } else {
            // support
            const isDebuff = skill.effects?.some(e => e.multiplier < 1.0);
            this.showTargetSelect(w, h, isDebuff ? 'enemy' : 'ally');
          }
        });
      }
    });
  }

  private showItemSelect(w: number, h: number): void {
    this.commandContainer.removeAll(true);
    this.phase = 'item_select';

    const cmdY = h * 0.78;
    const cmdH = h * 0.2;
    const margin = w * GAME.SAFE_MARGIN;

    const bg = this.add.graphics();
    bg.fillStyle(0x0D1117, 0.9);
    bg.fillRoundedRect(margin, cmdY, w - margin * 2, cmdH, 8);
    bg.lineStyle(2, 0x00E676, 0.7);
    bg.strokeRoundedRect(margin, cmdY, w - margin * 2, cmdH, 8);
    this.commandContainer.add(bg);

    const backText = this.add.text(margin + 15, cmdY + 8, '← 戻る', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: '14px',
      color: '#AAAACC',
    }).setInteractive();
    backText.on('pointerdown', () => {
      this.showCommandMenu(w, h);
    });
    this.commandContainer.add(backText);

    const items = this.saveData.inventory.filter(i => i.type === 'consumable' && i.quantity > 0);
    items.forEach((item, i) => {
      const y = cmdY + 35 + i * 28;
      const text = this.add.text(margin + 15, y, `${item.name} x${item.quantity}`, {
        fontFamily: GAME.FONT_FAMILY,
        fontSize: '14px',
        color: '#FFFFFF',
      }).setInteractive();
      this.commandContainer.add(text);

      text.on('pointerdown', () => {
        audioGenerator.playCursorSE();
        this.selectedCommand = 'item';
        this.selectedSkill = null;
        (this as unknown as Record<string, string>)._selectedItemId = item.id;
        this.showTargetSelect(w, h, 'ally');
      });
    });
  }

  private showTargetSelect(w: number, h: number, targetType: string): void {
    this.commandContainer.removeAll(true);
    this.phase = 'target_select';

    const state = this.battleSystem.getState();

    if (targetType === 'all_enemy') {
      // 全体攻撃 — すぐ実行
      const targets = state.enemies.filter(e => e.hp > 0);
      if (targets.length > 0 && this.selectedSkill) {
        this.executeAction({ type: 'skill', skill: this.selectedSkill, targetId: targets[0].id });
      }
      return;
    }

    if (targetType === 'all_ally') {
      const targets = state.allies.filter(a => a.hp > 0);
      if (targets.length > 0 && this.selectedSkill) {
        this.executeAction({ type: 'skill', skill: this.selectedSkill, targetId: targets[0].id });
      }
      return;
    }

    // ターゲット選択表示
    const targets = targetType === 'enemy'
      ? state.enemies.filter(e => e.hp > 0)
      : targetType === 'dead_ally'
        ? state.allies.filter(a => a.hp <= 0)
        : state.allies.filter(a => a.hp > 0);

    // ターゲットハイライト
    targets.forEach((target) => {
      const isEnemy = targetType === 'enemy';
      const sprite = isEnemy ? this.enemySprites.get(target.id) : this.allySprites.get(target.id);
      if (!sprite) return;

      // ハイライトインジケーター
      const highlight = this.add.graphics();
      highlight.lineStyle(3, 0xFFD700, 0.8);
      highlight.strokeCircle(sprite.x, sprite.y, 45);
      this.commandContainer.add(highlight);

      // クリック判定
      const hit = this.add.rectangle(sprite.x, sprite.y, 80, 80).setInteractive().setAlpha(0.001);
      this.commandContainer.add(hit);

      hit.on('pointerdown', () => {
        audioGenerator.playConfirmSE();
        if (this.selectedCommand === 'attack') {
          this.executeAction({ type: 'attack', targetId: target.id });
        } else if (this.selectedSkill) {
          this.executeAction({ type: 'skill', skill: this.selectedSkill, targetId: target.id });
        } else if (this.selectedCommand === 'item') {
          const itemId = (this as unknown as Record<string, string>)._selectedItemId;
          this.executeAction({ type: 'item', itemId, targetId: target.id });
          // アイテム消費
          const item = this.saveData.inventory.find(i => i.id === itemId);
          if (item) item.quantity--;
        }
      });
    });

    // 戻るボタン
    const backBtn = this.add.text(w * GAME.SAFE_MARGIN + 15, h * 0.95, '← 戻る', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: '16px',
      color: '#AAAACC',
    }).setInteractive();
    backBtn.on('pointerdown', () => {
      this.showCommandMenu(w, h);
    });
    this.commandContainer.add(backBtn);
  }

  private executeAction(action: BattleAction): void {
    this.phase = 'animating';
    this.commandContainer.removeAll(true);

    const events = this.battleSystem.executeAllyAction(this.activeAllyId, action);
    this.processEvents(events);
  }

  private processEvents(events: BattleEvent[]): void {
    if (events.length === 0) {
      this.onAnimationComplete();
      return;
    }

    this.isProcessingEvents = true;
    let delay = 0;

    events.forEach((event, i) => {
      this.time.delayedCall(delay, () => {
        this.displayEvent(event);
      });
      // スキル攻撃は長めの演出時間
      if (event.type === 'damage' && event.skillName) {
        delay += 700;
      } else if (event.type === 'awaken') {
        delay += 1500;
      } else {
        delay += 400;
      }
    });

    this.time.delayedCall(delay + 300, () => {
      this.isProcessingEvents = false;
      this.refreshUI();
      this.onAnimationComplete();
    });
  }

  private displayEvent(event: BattleEvent): void {
    const { width, height } = this.scale.gameSize;

    switch (event.type) {
      case 'damage': {
        const targetSprite = this.enemySprites.get(event.targetId) ?? this.allySprites.get(event.targetId);
        if (!targetSprite) break;

        const isSkill = !!event.skillName;
        const element = event.element ?? 'none';

        if (isSkill) {
          // スキル名表示
          const elemColor = this.getElementColorHex(element);
          const skillText = this.add.text(width / 2, height * 0.28, event.skillName!, {
            fontFamily: GAME.FONT_FAMILY,
            fontSize: '26px',
            color: elemColor,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
          }).setOrigin(0.5).setAlpha(0).setScale(1.5);

          this.tweens.add({
            targets: skillText,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: () => {
              this.tweens.add({
                targets: skillText,
                alpha: 0,
                y: skillText.y - 20,
                delay: 300,
                duration: 300,
                onComplete: () => skillText.destroy(),
              });
            },
          });

          // 属性エフェクト + SE
          audioGenerator.playElementSE(element);
          this.displayElementEffect(element, targetSprite.x, targetSprite.y);

          // 属性フラッシュオーバーレイ
          const flashColor = this.getElementColor(element);
          const flash = this.add.graphics();
          flash.fillStyle(flashColor, 0.15);
          flash.fillRect(0, 0, width, height);
          this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 400,
            onComplete: () => flash.destroy(),
          });

          // スクリーンシェイク（強め）
          this.cameras.main.shake(200, 0.025);
        } else {
          // 通常攻撃
          audioGenerator.playAttackSE();

          // 斬撃エフェクト
          this.displaySlashEffect(targetSprite.x, targetSprite.y);

          // スクリーンシェイク
          this.cameras.main.shake(100, 0.012);
        }

        audioGenerator.playDamageSE();

        // ダメージ数値（属性カラー、スキル時は大きく）
        const dmgColor = isSkill ? this.getElementColorHex(element) : '#FF4444';
        const dmgSize = isSkill ? '36px' : '28px';
        const dmgText = this.add.text(targetSprite.x, targetSprite.y - 30, `${event.value}`, {
          fontFamily: GAME.FONT_FAMILY,
          fontSize: dmgSize,
          color: dmgColor,
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 4,
        }).setOrigin(0.5).setScale(isSkill ? 1.3 : 1);

        this.tweens.add({
          targets: dmgText,
          y: dmgText.y - 50,
          scaleX: 1,
          scaleY: 1,
          alpha: 0,
          duration: 1000,
          ease: 'Power2',
          onComplete: () => dmgText.destroy(),
        });

        // 被ダメアニメ（赤フラッシュ → 点滅）
        const tintColor = isSkill ? this.getElementColor(element) : 0xFF0000;
        this.tweens.add({
          targets: targetSprite,
          tint: tintColor,
          duration: 80,
          yoyo: true,
          repeat: isSkill ? 2 : 1,
          onComplete: () => targetSprite.clearTint(),
        });

        // ノックバック（スキル時は大きく）
        const isAlly = this.allySprites.has(event.targetId);
        const knockback = isSkill ? 25 : 15;
        this.tweens.add({
          targets: targetSprite,
          x: targetSprite.x + (isAlly ? knockback : -knockback),
          duration: 80,
          yoyo: true,
        });
        break;
      }
      case 'heal': {
        const targetSprite = this.allySprites.get(event.targetId);
        if (!targetSprite) break;

        audioGenerator.playHealSE();

        // 回復パーティクル（光の粒が上昇）
        for (let i = 0; i < 8; i++) {
          const particle = this.add.graphics();
          particle.fillStyle(0x44FF88, 0.8);
          particle.fillCircle(0, 0, 3);
          particle.setPosition(
            targetSprite.x + (Math.random() - 0.5) * 50,
            targetSprite.y + 20,
          );
          this.tweens.add({
            targets: particle,
            y: particle.y - 60 - Math.random() * 30,
            x: particle.x + (Math.random() - 0.5) * 20,
            alpha: 0,
            duration: 600 + Math.random() * 300,
            delay: i * 40,
            onComplete: () => particle.destroy(),
          });
        }

        const healText = this.add.text(targetSprite.x, targetSprite.y - 30, `+${event.value}`, {
          fontFamily: GAME.FONT_FAMILY,
          fontSize: '28px',
          color: '#44FF88',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        }).setOrigin(0.5);

        this.tweens.add({
          targets: healText,
          y: healText.y - 50,
          alpha: 0,
          duration: 900,
          ease: 'Power2',
          onComplete: () => healText.destroy(),
        });
        break;
      }
      case 'weak': {
        const weakText = this.add.text(width / 2, height * 0.35, '⚡ WEAK! ⚡', {
          fontFamily: GAME.FONT_FAMILY,
          fontSize: '44px',
          color: '#FF2222',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 5,
        }).setOrigin(0.5).setScale(0.3);

        this.tweens.add({
          targets: weakText,
          scaleX: 1.2,
          scaleY: 1.2,
          duration: 200,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: weakText,
              scaleX: 1.8,
              scaleY: 1.8,
              alpha: 0,
              duration: 500,
              ease: 'Power2',
              onComplete: () => weakText.destroy(),
            });
          },
        });
        this.cameras.main.shake(250, 0.03);
        // 赤フラッシュ
        const weakFlash = this.add.graphics();
        weakFlash.fillStyle(0xFF0000, 0.2);
        weakFlash.fillRect(0, 0, width, height);
        this.tweens.add({
          targets: weakFlash,
          alpha: 0,
          duration: 300,
          onComplete: () => weakFlash.destroy(),
        });
        break;
      }
      case 'resist': {
        const resistText = this.add.text(width / 2, height * 0.35, 'RESIST', {
          fontFamily: GAME.FONT_FAMILY,
          fontSize: '34px',
          color: '#6688CC',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 4,
        }).setOrigin(0.5);

        this.tweens.add({
          targets: resistText,
          alpha: 0,
          y: resistText.y - 15,
          duration: 700,
          onComplete: () => resistText.destroy(),
        });
        break;
      }
      case 'critical': {
        const critText = this.add.text(width / 2, height * 0.3, '💥 CRITICAL! 💥', {
          fontFamily: GAME.FONT_FAMILY,
          fontSize: '42px',
          color: '#FFD700',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 5,
        }).setOrigin(0.5).setScale(0.3);

        this.tweens.add({
          targets: critText,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 200,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: critText,
              scaleX: 2,
              scaleY: 2,
              alpha: 0,
              duration: 600,
              onComplete: () => critText.destroy(),
            });
          },
        });
        // ゴールドフラッシュ
        const critFlash = this.add.graphics();
        critFlash.fillStyle(0xFFD700, 0.15);
        critFlash.fillRect(0, 0, width, height);
        this.tweens.add({
          targets: critFlash,
          alpha: 0,
          duration: 400,
          onComplete: () => critFlash.destroy(),
        });
        this.cameras.main.shake(200, 0.025);
        break;
      }
      case 'death': {
        const targetSprite = this.enemySprites.get(event.targetId) ?? this.allySprites.get(event.targetId);
        if (!targetSprite) break;

        this.tweens.add({
          targets: targetSprite,
          alpha: 0.2,
          duration: 500,
        });
        break;
      }
      case 'awaken': {
        audioGenerator.playAwakenSE();

        // 覚醒演出
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);

        const actorSprite = this.allySprites.get(event.actorId);
        const actor = this.allies.find(a => a.id === event.actorId);
        if (actorSprite && actor) {
          // カットイン
          const cutinText = this.add.text(width / 2, height * 0.3, actor.awakenSkillName, {
            fontFamily: GAME.FONT_FAMILY,
            fontSize: '42px',
            color: actor.colorHex,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5,
          }).setOrigin(0.5).setAlpha(0);

          this.tweens.add({
            targets: cutinText,
            alpha: 1,
            scaleX: { from: 2, to: 1 },
            scaleY: { from: 2, to: 1 },
            duration: 500,
          });

          // スキル名テキスト
          const skillNameText = this.add.text(width / 2, height * 0.4, actor.awakenSkillDescription, {
            fontFamily: GAME.FONT_FAMILY,
            fontSize: '18px',
            color: '#C0C0D0',
          }).setOrigin(0.5).setAlpha(0);

          this.tweens.add({
            targets: skillNameText,
            alpha: 1,
            duration: 500,
            delay: 300,
          });

          // 演出終了
          this.time.delayedCall(1200, () => {
            overlay.destroy();
            cutinText.destroy();
            skillNameText.destroy();
          });
        }
        break;
      }
      case 'buff':
      case 'debuff': {
        const targetSprite = this.allySprites.get(event.targetId) ?? this.enemySprites.get(event.targetId);
        if (!targetSprite) break;

        const buffText = this.add.text(targetSprite.x, targetSprite.y - 20,
          event.type === 'buff' ? (event.skillName ?? '強化') : (event.skillName ?? '弱体'), {
            fontFamily: GAME.FONT_FAMILY,
            fontSize: '16px',
            color: event.type === 'buff' ? '#44AAFF' : '#AA44FF',
            fontStyle: 'bold',
          }).setOrigin(0.5);

        this.tweens.add({
          targets: buffText,
          y: buffText.y - 30,
          alpha: 0,
          duration: 600,
          onComplete: () => buffText.destroy(),
        });
        break;
      }
    }
  }

  private onAnimationComplete(): void {
    const state = this.battleSystem.getState();

    if (state.isFinished) {
      audioGenerator.stopBGM();
      if (state.victory) {
        audioGenerator.playVictorySE();
        this.time.delayedCall(1000, () => {
          const rewards = this.battleSystem.getBattleRewards();
          this.scene.start(SCENES.RESULT, {
            saveData: this.saveData,
            rewards,
            isBoss: this.isBoss,
          });
        });
      } else {
        // 敗北
        this.showGameOver();
      }
      return;
    }

    this.phase = 'waiting';
    this.activeAllyId = '';
    // ATBを再開して次のユニットのゲージを進める
    this.battleSystem.getATBManager().resume();
  }

  private showGameOver(): void {
    const { width, height } = this.scale.gameSize;
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, width, height);

    this.add.text(width / 2, height * 0.4, 'GAME OVER', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: '48px',
      color: '#FF1744',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const retryText = this.add.text(width / 2, height * 0.6, 'タイトルに戻る', {
      fontFamily: GAME.FONT_FAMILY,
      fontSize: '24px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setInteractive();

    retryText.on('pointerdown', () => {
      this.scene.start(SCENES.TITLE);
    });
  }

  private playEncounterEffect(w: number, h: number): void {
    // エンカウント演出：画面フラッシュ
    const flash = this.add.graphics();
    flash.fillStyle(0xFFFFFF, 0.8);
    flash.fillRect(0, 0, w, h);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
  }

  private refreshUI(): void {
    const { width, height } = this.scale.gameSize;

    // ステータスUI更新
    this.drawStatusUI(width, height);

    // 敵HPバー更新
    const state = this.battleSystem.getState();
    const spacing = width / (this.enemies.length + 1);
    state.enemies.forEach((enemy, i) => {
      const x = spacing * (i + 1);
      const y = height * 0.15 + (enemy.isBoss ? 0 : height * 0.05) + 75 * (enemy.isBoss ? 1.2 : 0.8);
      this.drawEnemyHPBar(x, y, enemy, width * 0.12);
    });
  }

  private getElementColor(element: string): number {
    const map: Record<string, number> = {
      fire: 0xFF4444,
      ice: 0x87CEEB,
      thunder: 0xFFD700,
      water: 0x4488FF,
      light: 0xFFFFFF,
      dark: 0x8844AA,
      none: 0xCCCCCC,
    };
    return map[element] ?? 0xCCCCCC;
  }

  private getElementColorHex(element: string): string {
    const map: Record<string, string> = {
      fire: '#FF6633',
      ice: '#66CCFF',
      thunder: '#FFD700',
      water: '#3388FF',
      light: '#FFFFCC',
      dark: '#AA55DD',
      none: '#CCCCCC',
    };
    return map[element] ?? '#CCCCCC';
  }

  private displaySlashEffect(x: number, y: number): void {
    const slash = this.add.graphics();
    slash.lineStyle(3, 0xFFFFFF, 0.9);
    // 斜めの斬撃ライン
    const len = 40;
    slash.beginPath();
    slash.moveTo(x - len, y - len);
    slash.lineTo(x + len, y + len);
    slash.strokePath();
    slash.beginPath();
    slash.moveTo(x + len, y - len * 0.5);
    slash.lineTo(x - len, y + len * 0.5);
    slash.strokePath();

    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 300,
      onComplete: () => slash.destroy(),
    });
  }

  private displayElementEffect(element: string, x: number, y: number): void {
    switch (element) {
      case 'fire': this.displayFireEffect(x, y); break;
      case 'ice': this.displayIceEffect(x, y); break;
      case 'thunder': this.displayThunderEffect(x, y); break;
      case 'water': this.displayWaterEffect(x, y); break;
      case 'light': this.displayLightEffect(x, y); break;
      case 'dark': this.displayDarkEffect(x, y); break;
    }
  }

  private displayFireEffect(x: number, y: number): void {
    // 炎パーティクル（赤〜オレンジの粒が上昇）
    for (let i = 0; i < 16; i++) {
      const particle = this.add.graphics();
      const colors = [0xFF2200, 0xFF6600, 0xFFAA00, 0xFF4400];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 5;
      particle.fillStyle(color, 0.9);
      particle.fillCircle(0, 0, size);
      particle.setPosition(
        x + (Math.random() - 0.5) * 60,
        y + (Math.random() - 0.5) * 30,
      );

      this.tweens.add({
        targets: particle,
        y: particle.y - 50 - Math.random() * 60,
        x: particle.x + (Math.random() - 0.5) * 40,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 400 + Math.random() * 300,
        delay: i * 25,
        ease: 'Power1',
        onComplete: () => particle.destroy(),
      });
    }

    // 爆発リング
    const ring = this.add.graphics();
    ring.lineStyle(4, 0xFF4400, 0.8);
    ring.strokeCircle(x, y, 5);
    this.tweens.add({
      targets: ring,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
  }

  private displayIceEffect(x: number, y: number): void {
    // 氷結晶パーティクル
    for (let i = 0; i < 12; i++) {
      const crystal = this.add.graphics();
      const colors = [0x88CCFF, 0xAADDFF, 0xCCEEFF, 0xFFFFFF];
      crystal.fillStyle(colors[Math.floor(Math.random() * colors.length)], 0.9);
      // ダイヤ形の結晶
      const s = 4 + Math.random() * 4;
      crystal.fillPoints([
        new Phaser.Geom.Point(0, -s),
        new Phaser.Geom.Point(s * 0.6, 0),
        new Phaser.Geom.Point(0, s),
        new Phaser.Geom.Point(-s * 0.6, 0),
      ], true);
      const angle = (i / 12) * Math.PI * 2;
      const dist = 5;
      crystal.setPosition(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist);

      this.tweens.add({
        targets: crystal,
        x: x + Math.cos(angle) * (40 + Math.random() * 30),
        y: y + Math.sin(angle) * (40 + Math.random() * 30),
        angle: Math.random() * 360,
        alpha: 0,
        duration: 500 + Math.random() * 300,
        delay: i * 20,
        ease: 'Power2',
        onComplete: () => crystal.destroy(),
      });
    }

    // フロストリング
    const frost = this.add.graphics();
    frost.lineStyle(3, 0xAADDFF, 0.7);
    frost.strokeCircle(x, y, 10);
    this.tweens.add({
      targets: frost,
      scaleX: 3.5,
      scaleY: 3.5,
      alpha: 0,
      duration: 500,
      onComplete: () => frost.destroy(),
    });
  }

  private displayThunderEffect(x: number, y: number): void {
    // 稲妻ライン（上から落ちてくる）
    for (let i = 0; i < 3; i++) {
      const lightning = this.add.graphics();
      lightning.lineStyle(3 - i * 0.5, 0xFFDD00, 0.9 - i * 0.2);
      lightning.beginPath();
      let lx = x + (Math.random() - 0.5) * 40;
      let ly = y - 100;
      lightning.moveTo(lx, ly);

      for (let s = 0; s < 6; s++) {
        lx += (Math.random() - 0.5) * 25;
        ly += 18 + Math.random() * 10;
        lightning.lineTo(lx, ly);
      }
      lightning.lineTo(x + (Math.random() - 0.5) * 10, y);
      lightning.strokePath();

      this.tweens.add({
        targets: lightning,
        alpha: 0,
        duration: 200 + i * 100,
        delay: i * 50,
        onComplete: () => lightning.destroy(),
      });
    }

    // 白フラッシュ
    const { width, height } = this.scale.gameSize;
    const flash = this.add.graphics();
    flash.fillStyle(0xFFFFFF, 0.3);
    flash.fillRect(0, 0, width, height);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 150,
      onComplete: () => flash.destroy(),
    });

    // スパーク
    for (let i = 0; i < 8; i++) {
      const spark = this.add.graphics();
      spark.fillStyle(0xFFFF66, 0.8);
      spark.fillCircle(0, 0, 2);
      spark.setPosition(x, y);
      const angle = Math.random() * Math.PI * 2;
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * (30 + Math.random() * 20),
        y: y + Math.sin(angle) * (30 + Math.random() * 20),
        alpha: 0,
        duration: 250,
        delay: 50 + i * 15,
        onComplete: () => spark.destroy(),
      });
    }
  }

  private displayWaterEffect(x: number, y: number): void {
    // 水しぶき（泡＋ウェーブ）
    for (let i = 0; i < 14; i++) {
      const drop = this.add.graphics();
      const colors = [0x2266FF, 0x44AAFF, 0x66CCFF, 0x88DDFF];
      drop.fillStyle(colors[Math.floor(Math.random() * colors.length)], 0.7);
      drop.fillCircle(0, 0, 2 + Math.random() * 4);
      drop.setPosition(x + (Math.random() - 0.5) * 20, y);

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 40 + Math.random() * 40;
      this.tweens.add({
        targets: drop,
        x: drop.x + Math.cos(angle) * speed,
        y: drop.y + Math.sin(angle) * speed + 30,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 500 + Math.random() * 200,
        delay: i * 20,
        ease: 'Power1',
        onComplete: () => drop.destroy(),
      });
    }

    // 波紋
    for (let i = 0; i < 3; i++) {
      const wave = this.add.graphics();
      wave.lineStyle(2, 0x44AAFF, 0.6);
      wave.strokeCircle(x, y + 10, 5);
      this.tweens.add({
        targets: wave,
        scaleX: 2 + i,
        scaleY: 1.5 + i * 0.5,
        alpha: 0,
        duration: 500,
        delay: i * 120,
        onComplete: () => wave.destroy(),
      });
    }
  }

  private displayLightEffect(x: number, y: number): void {
    // 放射状の光線
    const numRays = 8;
    for (let i = 0; i < numRays; i++) {
      const ray = this.add.graphics();
      const angle = (i / numRays) * Math.PI * 2;
      ray.fillStyle(0xFFFFDD, 0.6);
      ray.fillPoints([
        new Phaser.Geom.Point(x, y),
        new Phaser.Geom.Point(x + Math.cos(angle - 0.05) * 8, y + Math.sin(angle - 0.05) * 8),
        new Phaser.Geom.Point(x + Math.cos(angle) * 50, y + Math.sin(angle) * 50),
        new Phaser.Geom.Point(x + Math.cos(angle + 0.05) * 8, y + Math.sin(angle + 0.05) * 8),
      ], true);
      ray.setAlpha(0);

      this.tweens.add({
        targets: ray,
        alpha: 0.8,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 200,
        delay: i * 30,
        yoyo: true,
        hold: 100,
        onComplete: () => ray.destroy(),
      });
    }

    // 中心の輝き
    const glow = this.add.graphics();
    glow.fillStyle(0xFFFFFF, 0.8);
    glow.fillCircle(x, y, 8);
    this.tweens.add({
      targets: glow,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 500,
      onComplete: () => glow.destroy(),
    });

    // 金色パーティクル
    for (let i = 0; i < 10; i++) {
      const sparkle = this.add.graphics();
      sparkle.fillStyle(0xFFFFAA, 0.9);
      sparkle.fillCircle(0, 0, 2);
      sparkle.setPosition(x, y);
      const angle = Math.random() * Math.PI * 2;
      this.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * (35 + Math.random() * 25),
        y: y + Math.sin(angle) * (35 + Math.random() * 25),
        alpha: 0,
        duration: 400 + Math.random() * 200,
        delay: 100 + i * 20,
        onComplete: () => sparkle.destroy(),
      });
    }
  }

  private displayDarkEffect(x: number, y: number): void {
    // 闇の渦パーティクル（内向きに吸い込まれる）
    for (let i = 0; i < 14; i++) {
      const shadow = this.add.graphics();
      const colors = [0x440066, 0x660088, 0x330044, 0x220033];
      shadow.fillStyle(colors[Math.floor(Math.random() * colors.length)], 0.8);
      shadow.fillCircle(0, 0, 3 + Math.random() * 4);
      const angle = (i / 14) * Math.PI * 2;
      const dist = 50 + Math.random() * 30;
      shadow.setPosition(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist);

      this.tweens.add({
        targets: shadow,
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 400 + Math.random() * 200,
        delay: i * 20,
        ease: 'Power3',
        onComplete: () => shadow.destroy(),
      });
    }

    // 闇のリング（拡大→縮小）
    const darkRing = this.add.graphics();
    darkRing.lineStyle(4, 0x8844AA, 0.8);
    darkRing.strokeCircle(x, y, 30);
    this.tweens.add({
      targets: darkRing,
      scaleX: 0.2,
      scaleY: 0.2,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => darkRing.destroy(),
    });

    // 暗転フラッシュ
    const { width, height } = this.scale.gameSize;
    const dark = this.add.graphics();
    dark.fillStyle(0x000000, 0.3);
    dark.fillRect(0, 0, width, height);
    this.tweens.add({
      targets: dark,
      alpha: 0,
      duration: 400,
      onComplete: () => dark.destroy(),
    });
  }

  update(_time: number, delta: number): void {
    if (this.phase === 'animating' || this.isProcessingEvents) return;

    const state = this.battleSystem.getState();
    if (state.isFinished) return;

    // ATB更新
    const readyUnit = this.battleSystem.update(delta);

    // ステータスUI定期更新
    this.refreshUI();

    if (readyUnit && this.phase === 'waiting') {
      // 味方のREADY
      const isAlly = state.allies.some(a => a.id === readyUnit.id);
      if (isAlly) {
        this.activeAllyId = readyUnit.id;
        this.battleSystem.getATBManager().pause();
        const { width, height } = this.scale.gameSize;
        this.showCommandMenu(width, height);
      } else {
        // 敵の行動
        this.phase = 'animating';
        this.battleSystem.getATBManager().pause();
        const events = this.battleSystem.executeEnemyAction(readyUnit.id);
        this.processEvents(events);
      }
    }
  }
}
