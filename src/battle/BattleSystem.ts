import { Character } from '../characters/CharacterData';
import { Enemy, EnemySkill } from '../characters/EnemyData';
import { Skill } from '../characters/CharacterData';
import { ATBManager, ATBUnit } from './ATBManager';
import { calculateDamage, calculateHealing, DamageResult } from './ElementSystem';
import { GAME } from '../utils/constants';

export type BattleAction =
  | { type: 'attack'; targetId: string }
  | { type: 'skill'; skill: Skill; targetId: string }
  | { type: 'item'; itemId: string; targetId: string }
  | { type: 'defend' }
  | { type: 'awaken' };

export interface BattleEvent {
  type: 'damage' | 'heal' | 'miss' | 'buff' | 'debuff' | 'death' | 'revive' | 'awaken' | 'weak' | 'resist' | 'critical';
  actorId: string;
  targetId: string;
  value: number;
  skillName?: string;
  element?: string;
  elementMultiplier?: number;
}

export interface ActiveEffect {
  type: string;
  multiplier: number;
  remainingTurns: number;
  sourceId: string;
}

export interface BattleState {
  allies: Character[];
  enemies: Enemy[];
  turn: number;
  isFinished: boolean;
  victory: boolean;
  events: BattleEvent[];
  activeEffects: Map<string, ActiveEffect[]>;
}

export class BattleSystem {
  private state: BattleState;
  private atbManager: ATBManager;

  constructor(allies: Character[], enemies: Enemy[]) {
    this.atbManager = new ATBManager();
    this.state = {
      allies: allies.map(a => ({ ...a })),
      enemies: enemies.map(e => ({ ...e })),
      turn: 0,
      isFinished: false,
      victory: false,
      events: [],
      activeEffects: new Map(),
    };

    // ATBユニット登録
    for (const ally of this.state.allies) {
      this.atbManager.addUnit(ally.id, ally.agility);
    }
    for (const enemy of this.state.enemies) {
      this.atbManager.addUnit(enemy.id, enemy.agility);
    }
  }

  getState(): BattleState {
    return this.state;
  }

  getATBManager(): ATBManager {
    return this.atbManager;
  }

  clearEvents(): void {
    this.state.events = [];
  }

  update(delta: number): ATBUnit | null {
    if (this.state.isFinished) return null;
    return this.atbManager.update(delta);
  }

  executeAllyAction(actorId: string, action: BattleAction): BattleEvent[] {
    const events: BattleEvent[] = [];
    const actor = this.state.allies.find(a => a.id === actorId);
    if (!actor || actor.hp <= 0) return events;

    switch (action.type) {
      case 'attack': {
        const target = this.findEnemy(action.targetId);
        if (!target) break;
        const result = calculateDamage(
          actor.attack + (actor.weapon.stats.attack ?? 0),
          target.defense,
          30 + actor.level * 2,
          actor.element,
          target.element,
          false,
          false,
        );
        target.hp = Math.max(0, target.hp - result.damage);
        events.push({ type: 'damage', actorId, targetId: target.id, value: result.damage, element: actor.element, elementMultiplier: result.elementMultiplier });
        if (result.isWeak) events.push({ type: 'weak', actorId, targetId: target.id, value: result.damage });
        if (result.isResist) events.push({ type: 'resist', actorId, targetId: target.id, value: result.damage });
        if (result.isCritical) events.push({ type: 'critical', actorId, targetId: target.id, value: result.damage });
        if (target.hp <= 0) events.push({ type: 'death', actorId, targetId: target.id, value: 0 });
        break;
      }
      case 'skill': {
        const skill = action.skill;
        if (actor.sp < skill.spCost) break;
        actor.sp -= skill.spCost;

        if (skill.type === 'attack') {
          const targets = skill.target === 'all'
            ? this.state.enemies.filter(e => e.hp > 0)
            : skill.target === 'random'
              ? this.getRandomTargets(skill.hitCount)
              : [this.findEnemy(action.targetId)].filter(Boolean) as Enemy[];

          for (const target of targets) {
            const result = calculateDamage(
              actor.magicAttack + (actor.weapon.stats.magicAttack ?? 0),
              target.magicDefense,
              skill.power,
              skill.element,
              target.element,
              true,
              false,
            );
            target.hp = Math.max(0, target.hp - result.damage);
            events.push({ type: 'damage', actorId, targetId: target.id, value: result.damage, skillName: skill.name, element: skill.element, elementMultiplier: result.elementMultiplier });
            if (result.isWeak) events.push({ type: 'weak', actorId, targetId: target.id, value: result.damage });
            if (result.isResist) events.push({ type: 'resist', actorId, targetId: target.id, value: result.damage });
            if (target.hp <= 0) events.push({ type: 'death', actorId, targetId: target.id, value: 0 });
          }

          // 状態効果適用
          if (skill.effects) {
            for (const target of targets) {
              if (target.hp > 0) {
                this.applyEffects(target.id, skill.effects, actorId);
              }
            }
          }
        } else if (skill.type === 'recovery') {
          if (skill.name === 'リヴァイブ') {
            const target = this.state.allies.find(a => a.id === action.targetId && a.hp <= 0);
            if (target) {
              target.hp = Math.floor(target.maxHp * 0.5);
              this.atbManager.setAlive(target.id, true);
              events.push({ type: 'revive', actorId, targetId: target.id, value: target.hp, skillName: skill.name });
            }
          } else if (skill.name === 'クレンズ') {
            const effects = this.state.activeEffects.get(action.targetId) ?? [];
            const negativeIdx = effects.findIndex(e => e.multiplier < 1.0);
            if (negativeIdx >= 0) effects.splice(negativeIdx, 1);
            events.push({ type: 'buff', actorId, targetId: action.targetId, value: 0, skillName: skill.name });
          } else {
            const targets = skill.target === 'all'
              ? this.state.allies.filter(a => a.hp > 0)
              : [this.state.allies.find(a => a.id === action.targetId)].filter(Boolean) as Character[];

            for (const target of targets) {
              const healAmount = calculateHealing(actor.magicAttack, skill.power);
              target.hp = Math.min(target.maxHp, target.hp + healAmount);
              events.push({ type: 'heal', actorId, targetId: target.id, value: healAmount, skillName: skill.name });
            }

            if (skill.effects) {
              for (const target of targets) {
                this.applyEffects(target.id, skill.effects, actorId);
              }
            }
          }
        } else if (skill.type === 'support') {
          if (skill.effects) {
            const isDebuff = skill.effects.some(e => e.multiplier < 1.0);
            if (isDebuff) {
              const target = this.findEnemy(action.targetId);
              if (target) {
                this.applyEffects(target.id, skill.effects, actorId);
                events.push({ type: 'debuff', actorId, targetId: target.id, value: 0, skillName: skill.name });
              }
            } else {
              const target = this.state.allies.find(a => a.id === action.targetId);
              if (target) {
                this.applyEffects(target.id, skill.effects, actorId);
                events.push({ type: 'buff', actorId, targetId: target.id, value: 0, skillName: skill.name });
              }
            }
          }
        }
        break;
      }
      case 'defend': {
        this.atbManager.setDefending(actorId, true);
        events.push({ type: 'buff', actorId, targetId: actorId, value: 0, skillName: '防御' });
        break;
      }
      case 'awaken': {
        if (actor.awakenGauge >= actor.maxAwakenGauge) {
          actor.awakenGauge = 0;
          events.push({ type: 'awaken', actorId, targetId: actorId, value: 0, skillName: actor.awakenSkillName });

          // 覚醒技の効果
          const awakenPower = 150 + actor.awakenLevel * 30;
          for (const enemy of this.state.enemies.filter(e => e.hp > 0)) {
            const result = calculateDamage(
              actor.magicAttack + actor.attack,
              enemy.magicDefense,
              awakenPower,
              actor.element,
              enemy.element,
              true,
              false,
            );
            enemy.hp = Math.max(0, enemy.hp - result.damage);
            events.push({ type: 'damage', actorId, targetId: enemy.id, value: result.damage, skillName: actor.awakenSkillName, elementMultiplier: result.elementMultiplier });
            if (result.isWeak) events.push({ type: 'weak', actorId, targetId: enemy.id, value: result.damage });
            if (enemy.hp <= 0) events.push({ type: 'death', actorId, targetId: enemy.id, value: 0 });
          }

          // ジンの場合はバリア付与
          if (actor.id === 'jin') {
            for (const ally of this.state.allies.filter(a => a.hp > 0)) {
              this.applyEffects(ally.id, [{ type: 'barrier', multiplier: 0.5, duration: 3 }], actorId);
              events.push({ type: 'buff', actorId, targetId: ally.id, value: 0, skillName: '黄金の加護' });
            }
          }
          // ミスティの場合はデバフ付与
          if (actor.id === 'misty') {
            for (const enemy of this.state.enemies.filter(e => e.hp > 0)) {
              this.applyEffects(enemy.id, [{ type: 'atkDown', multiplier: 0.7, duration: 3 }, { type: 'defDown', multiplier: 0.7, duration: 3 }], actorId);
            }
          }
        }
        break;
      }
      case 'item': {
        // アイテム使用
        const target = this.state.allies.find(a => a.id === action.targetId);
        if (!target) break;
        // ポーション: HP30%回復
        if (action.itemId === 'potion') {
          const heal = Math.floor(target.maxHp * 0.3);
          target.hp = Math.min(target.maxHp, target.hp + heal);
          events.push({ type: 'heal', actorId, targetId: target.id, value: heal, skillName: 'ポーション' });
        }
        // エーテル: SP30%回復
        if (action.itemId === 'ether') {
          const heal = Math.floor(target.maxSp * 0.3);
          target.sp = Math.min(target.maxSp, target.sp + heal);
          events.push({ type: 'heal', actorId, targetId: target.id, value: heal, skillName: 'エーテル' });
        }
        break;
      }
    }

    this.atbManager.resetGauge(actorId);
    this.checkBattleEnd();
    this.state.events.push(...events);
    return events;
  }

  executeEnemyAction(enemyId: string): BattleEvent[] {
    const events: BattleEvent[] = [];
    const enemy = this.state.enemies.find(e => e.id === enemyId);
    if (!enemy || enemy.hp <= 0) return events;

    // スキル選択（確率ベース）
    const skill = this.selectEnemySkill(enemy);
    if (!skill) {
      // 通常攻撃
      const aliveAllies = this.state.allies.filter(a => a.hp > 0);
      if (aliveAllies.length === 0) return events;
      const target = aliveAllies[Math.floor(Math.random() * aliveAllies.length)];
      const result = calculateDamage(enemy.attack, target.defense, 30, enemy.element, target.element, false, this.atbManager.getUnit(target.id)?.isDefending ?? false);
      target.hp = Math.max(0, target.hp - result.damage);

      // 覚醒ゲージ蓄積
      this.addAwakenGauge(target.id, GAME.AWAKEN_DAMAGE_GAIN);

      events.push({ type: 'damage', actorId: enemyId, targetId: target.id, value: result.damage, element: enemy.element });
      if (target.hp <= 0) {
        this.atbManager.setAlive(target.id, false);
        events.push({ type: 'death', actorId: enemyId, targetId: target.id, value: 0 });
        // 仲間が倒れた場合の覚醒ゲージ蓄積
        for (const ally of this.state.allies.filter(a => a.hp > 0)) {
          this.addAwakenGauge(ally.id, GAME.AWAKEN_ALLY_DOWN_GAIN);
        }
      }
    } else {
      // スキル使用
      const targets = skill.target === 'all'
        ? this.state.allies.filter(a => a.hp > 0)
        : skill.target === 'random'
          ? this.getRandomAllyTargets(skill.hitCount)
          : [this.getRandomAllyTarget()].filter(Boolean) as Character[];

      for (const target of targets) {
        if (skill.power < 0) {
          // 回復スキル
          const heal = Math.abs(skill.power);
          enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
          events.push({ type: 'heal', actorId: enemyId, targetId: enemyId, value: heal, skillName: skill.name });
        } else {
          const isMagic = skill.element !== 'none';
          const atkStat = isMagic ? enemy.magicAttack : enemy.attack;
          const defStat = isMagic ? target.magicDefense : target.defense;
          const result = calculateDamage(atkStat, defStat, skill.power, skill.element, target.element, isMagic, this.atbManager.getUnit(target.id)?.isDefending ?? false);
          target.hp = Math.max(0, target.hp - result.damage);

          this.addAwakenGauge(target.id, GAME.AWAKEN_DAMAGE_GAIN);

          events.push({ type: 'damage', actorId: enemyId, targetId: target.id, value: result.damage, skillName: skill.name, element: skill.element, elementMultiplier: result.elementMultiplier });
          if (result.isWeak) events.push({ type: 'weak', actorId: enemyId, targetId: target.id, value: result.damage });
          if (result.isResist) events.push({ type: 'resist', actorId: enemyId, targetId: target.id, value: result.damage });
          if (target.hp <= 0) {
            this.atbManager.setAlive(target.id, false);
            events.push({ type: 'death', actorId: enemyId, targetId: target.id, value: 0 });
            for (const ally of this.state.allies.filter(a => a.hp > 0)) {
              this.addAwakenGauge(ally.id, GAME.AWAKEN_ALLY_DOWN_GAIN);
            }
          }
        }
      }
    }

    this.atbManager.resetGauge(enemyId);
    this.checkBattleEnd();
    this.state.events.push(...events);
    return events;
  }

  private addAwakenGauge(allyId: string, amount: number): void {
    const ally = this.state.allies.find(a => a.id === allyId);
    if (ally && ally.hp > 0) {
      ally.awakenGauge = Math.min(ally.maxAwakenGauge, ally.awakenGauge + amount);
    }
  }

  private selectEnemySkill(enemy: Enemy): EnemySkill | null {
    const rand = Math.random();
    let cumulative = 0;
    for (const skill of enemy.skills) {
      cumulative += skill.probability;
      if (rand < cumulative) return skill;
    }
    return null;
  }

  private findEnemy(id: string): Enemy | undefined {
    return this.state.enemies.find(e => e.id === id && e.hp > 0);
  }

  private getRandomTargets(count: number): Enemy[] {
    const alive = this.state.enemies.filter(e => e.hp > 0);
    const targets: Enemy[] = [];
    for (let i = 0; i < count; i++) {
      targets.push(alive[Math.floor(Math.random() * alive.length)]);
    }
    return targets;
  }

  private getRandomAllyTarget(): Character | null {
    const alive = this.state.allies.filter(a => a.hp > 0);
    if (alive.length === 0) return null;
    return alive[Math.floor(Math.random() * alive.length)];
  }

  private getRandomAllyTargets(count: number): Character[] {
    const alive = this.state.allies.filter(a => a.hp > 0);
    const targets: Character[] = [];
    for (let i = 0; i < count; i++) {
      if (alive.length > 0) {
        targets.push(alive[Math.floor(Math.random() * alive.length)]);
      }
    }
    return targets;
  }

  private applyEffects(targetId: string, effects: { type: string; multiplier: number; duration: number }[], sourceId: string): void {
    const existing = this.state.activeEffects.get(targetId) ?? [];
    for (const effect of effects) {
      existing.push({
        type: effect.type,
        multiplier: effect.multiplier,
        remainingTurns: effect.duration,
        sourceId,
      });
    }
    this.state.activeEffects.set(targetId, existing);

    // ATB速度効果
    if (effects.some(e => e.type === 'spdUp' || e.type === 'spdDown')) {
      const spdEffects = existing.filter(e => e.type === 'spdUp' || e.type === 'spdDown');
      let multiplier = 1.0;
      for (const e of spdEffects) {
        multiplier *= e.multiplier;
      }
      this.atbManager.setSpeedMultiplier(targetId, multiplier);
    }
  }

  processEffectTurns(): void {
    for (const [targetId, effects] of this.state.activeEffects.entries()) {
      // リジェネ処理
      for (const effect of effects) {
        if (effect.type === 'regen') {
          const ally = this.state.allies.find(a => a.id === targetId);
          if (ally && ally.hp > 0) {
            const heal = Math.floor(ally.maxHp * effect.multiplier);
            ally.hp = Math.min(ally.maxHp, ally.hp + heal);
          }
        }
        if (effect.type === 'poison') {
          const target = this.state.allies.find(a => a.id === targetId) ?? this.state.enemies.find(e => e.id === targetId);
          if (target && target.hp > 0) {
            const damage = Math.floor(target.maxHp * effect.multiplier);
            target.hp = Math.max(1, target.hp - damage);
          }
        }
      }

      // ターン経過
      const remaining = effects
        .map(e => ({ ...e, remainingTurns: e.remainingTurns - 1 }))
        .filter(e => e.remainingTurns > 0);
      this.state.activeEffects.set(targetId, remaining);

      // 速度リセット
      if (remaining.filter(e => e.type === 'spdUp' || e.type === 'spdDown').length === 0) {
        this.atbManager.setSpeedMultiplier(targetId, 1.0);
      }
    }
  }

  private checkBattleEnd(): void {
    const allEnemiesDead = this.state.enemies.every(e => e.hp <= 0);
    const allAlliesDead = this.state.allies.every(a => a.hp <= 0);

    if (allEnemiesDead) {
      this.state.isFinished = true;
      this.state.victory = true;
    } else if (allAlliesDead) {
      this.state.isFinished = true;
      this.state.victory = false;
    }
  }

  getBattleRewards(): { exp: number; money: number; smp: number; items: string[] } {
    let exp = 0, money = 0, smp = 0;
    const items: string[] = [];
    for (const enemy of this.state.enemies) {
      exp += enemy.exp;
      money += enemy.money;
      smp += enemy.smp;
      for (const drop of enemy.dropItems ?? []) {
        if (Math.random() < drop.probability) {
          items.push(drop.name);
        }
      }
    }
    return { exp, money, smp, items };
  }
}
